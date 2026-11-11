"""File storage for Cu-Link. Firestore keyword search remains in firebase_config.

Supabase secret keys are sent only to the configured HTTPS project endpoint,
on the apikey header (never as a bearer JWT, a URL parameter, or a log value).
"""
import base64
import binascii
import os
import re
import uuid
from pathlib import Path
from urllib.parse import quote, urlsplit

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


class StorageError(RuntimeError):
    """An error safe to display without response bodies or credentials."""
    def __init__(self, message, status_code=None):
        super().__init__(message)
        self.status_code = status_code


def storage_provider():
    provider = os.getenv("STORAGE_PROVIDER", "firebase").strip().lower()
    if provider not in {"firebase", "supabase"}:
        raise StorageError("STORAGE_PROVIDER must be firebase or supabase")
    return provider


class SupabaseStorage:
    def __init__(self):
        raw_url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
        parsed = urlsplit(raw_url)
        if (parsed.scheme != "https" or not parsed.hostname
                or not re.fullmatch(r"[a-z0-9-]+\.supabase\.co", parsed.hostname)
                or parsed.netloc != parsed.hostname or parsed.path
                or parsed.query or parsed.fragment):
            raise StorageError("SUPABASE_URL must be the HTTPS project.supabase.co URL")
        self.url = raw_url
        self._secret = os.getenv("SUPABASE_SECRET_KEY", "").strip()
        if not self._secret.startswith("sb_secret_") or len(self._secret) <= 10:
            raise StorageError("Set SUPABASE_SECRET_KEY to a server-side sb_secret_ key")
        self.article_bucket = os.getenv("SUPABASE_ARTICLES_BUCKET", "articles").strip()
        self.image_bucket = os.getenv("SUPABASE_REPORT_IMAGES_BUCKET", "report-images").strip()
        for bucket in (self.article_bucket, self.image_bucket):
            if not re.fullmatch(r"[a-z0-9][a-z0-9_-]{0,62}", bucket):
                raise StorageError("Invalid Supabase bucket name")
        if self.article_bucket == self.image_bucket:
            raise StorageError("Article and report image buckets must be different")

    def __repr__(self):
        return "<SupabaseStorage credentials=redacted>"

    @staticmethod
    def _object_path(path):
        if not isinstance(path, str) or not path or path.startswith("/"):
            raise StorageError("Invalid storage object path")
        if any(part in {"", ".", ".."} for part in path.split("/")):
            raise StorageError("Invalid storage object path")
        return quote(path, safe="/")

    def _request(self, method, endpoint, *, data=None, json_body=None,
                 content_type=None, anonymous=False):
        headers = {} if anonymous else {"apikey": self._secret}
        if content_type:
            headers["Content-Type"] = content_type
        try:
            response = requests.request(
                method, self.url + "/storage/v1/" + endpoint,
                headers=headers, data=data, json=json_body,
                timeout=(10, 30), allow_redirects=False,
            )
        except requests.RequestException:
            raise StorageError("Supabase Storage network request failed") from None
        if not 200 <= response.status_code < 300:
            # Never propagate provider response text or a request object.
            status = response.status_code
            response.close()
            raise StorageError(f"Supabase Storage request failed (HTTP {status})", status)
        return response

    def verify_buckets(self):
        for name, expected_public in ((self.article_bucket, False), (self.image_bucket, True)):
            with self._request("GET", "bucket/" + quote(name, safe="")) as response:
                try:
                    info = response.json()
                except ValueError:
                    raise StorageError("Supabase returned invalid bucket metadata") from None
            if not isinstance(info, dict) or info.get("public") is not expected_public:
                raise StorageError(f"Bucket {name} must have Public={expected_public}")

    def upload(self, bucket, path, data, content_type):
        endpoint = "object/" + quote(bucket, safe="") + "/" + self._object_path(path)
        with self._request("POST", endpoint, data=data, content_type=content_type):
            pass

    def download(self, bucket, path):
        endpoint = "object/authenticated/" + quote(bucket, safe="") + "/" + self._object_path(path)
        with self._request("GET", endpoint) as response:
            return response.content

    def download_public(self, bucket, path):
        endpoint = "object/public/" + quote(bucket, safe="") + "/" + self._object_path(path)
        with self._request("GET", endpoint, anonymous=True) as response:
            return response.content

    def delete(self, bucket, path):
        self._object_path(path)
        with self._request("DELETE", "object/" + quote(bucket, safe=""), json_body={"prefixes": [path]}):
            pass

    def public_image_url(self, path):
        return self.url + "/storage/v1/object/public/" + quote(self.image_bucket, safe="") + "/" + self._object_path(path)


class SupabaseArticleBlob:
    def __init__(self, client, path):
        self.client = client
        self.path = path

    def download_as_bytes(self):
        return self.client.download(self.client.article_bucket, self.path)

    def download_as_text(self):
        return self.download_as_bytes().decode("utf-8-sig")


class SupabaseArticleBucket:
    """Retain the existing article readers' bucket.blob interface."""
    def __init__(self):
        self.client = SupabaseStorage()

    def blob(self, path):
        # Firebase used articles/123.json; Supabase's bucket itself is articles.
        if path.startswith("articles/"):
            path = path[len("articles/"):]
        self.client._object_path(path)
        return SupabaseArticleBlob(self.client, path)


def get_article_bucket():
    if storage_provider() == "supabase":
        return SupabaseArticleBucket()
    from firebase_admin import storage
    return storage.bucket()


def decode_report_image(image_data):
    try:
        header, payload = image_data.split(",", 1)
        if header.lower() != "data:image/png;base64":
            raise ValueError
        if len(payload) > 14 * 1024 * 1024:
            raise ValueError
        image = base64.b64decode(payload, validate=True)
        if not image.startswith(b"\x89PNG\r\n\x1a\n") or len(image) > 10 * 1024 * 1024:
            raise ValueError
        return image
    except (ValueError, AttributeError, binascii.Error):
        raise StorageError("Report image must be a PNG data URL, up to 10 MiB") from None


def upload_report_image(image_data, rep_id):
    image = decode_report_image(image_data)
    if storage_provider() == "supabase":
        client = SupabaseStorage()
        # Random suffix prevents discovery by guessing sequential report IDs.
        path = f"images/{int(rep_id)}-{uuid.uuid4().hex}.png"
        url = client.public_image_url(path)
        if len(url) > 255:
            raise StorageError("Report image URL exceeds the existing rep_img column length")
        client.upload(client.image_bucket, path, image, "image/png")
        return url

    from firebase_admin import storage
    bucket = storage.bucket()
    path = f"images/{int(rep_id)}.png"
    blob = bucket.blob(path)
    blob.upload_from_string(image, content_type="image/png")
    metadata = blob.metadata or {}
    token = metadata.get("firebaseStorageDownloadTokens")
    if not token:
        token = str(uuid.uuid4())
        blob.metadata = {**metadata, "firebaseStorageDownloadTokens": token}
        blob.patch()
    return (f"https://firebasestorage.googleapis.com/v0/b/{bucket.name}/o/"
            f"{quote(path, safe='')}?alt=media&token={token}")
