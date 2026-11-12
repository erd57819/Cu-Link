"""Offline contract tests. Uses fake credentials and in-memory HTTP responses."""
import asyncio
import base64
import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch
from urllib.parse import unquote

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services import object_storage as storage
from check_supabase_storage import PNG, write_probe

ENV = {
    "STORAGE_PROVIDER": "supabase",
    "SUPABASE_URL": "https://exampleproject.supabase.co",
    "SUPABASE_SECRET_KEY": "sb_secret_not_a_real_credential",
}


class Response:
    def __init__(self, status=200, content=b"", value=None):
        self.status_code, self.content, self.value = status, content, value
    def json(self):
        return self.value
    def close(self):
        pass
    def __enter__(self):
        return self
    def __exit__(self, *args):
        self.close()


class FakeStorageHTTP:
    def __init__(self):
        self.objects, self.calls = {}, []
    def request(self, method, url, **kwargs):
        self.calls.append((method, url, kwargs))
        endpoint = unquote(url.split("/storage/v1/", 1)[1])
        headers = kwargs["headers"]
        privileged = headers.get("apikey") == ENV["SUPABASE_SECRET_KEY"]
        if endpoint.startswith("bucket/"):
            name = endpoint.split("/", 1)[1]
            return Response(value={"name": name, "public": name == "report-images"})
        if method == "DELETE":
            bucket = endpoint.split("/", 1)[1]
            for path in kwargs["json"]["prefixes"]:
                self.objects.pop((bucket, path), None)
            return Response()
        if endpoint.startswith("object/authenticated/"):
            bucket, path = endpoint[len("object/authenticated/"):].split("/", 1)
        elif endpoint.startswith("object/public/"):
            bucket, path = endpoint[len("object/public/"):].split("/", 1)
            if bucket != "report-images":
                return Response(status=403)
        else:
            bucket, path = endpoint[len("object/"):].split("/", 1)
        if method == "POST":
            if not privileged:
                return Response(status=403)
            self.objects[bucket, path] = kwargs["data"]
            return Response()
        if bucket != "report-images" and not privileged:
            return Response(status=403)
        value = self.objects.get((bucket, path))
        return Response(content=value) if value is not None else Response(status=404)


class StorageTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, ENV, clear=True)
        self.env.start()
        self.http = FakeStorageHTTP()
        self.network = patch.object(storage.requests, "request", self.http.request)
        self.network.start()
    def tearDown(self):
        self.network.stop()
        self.env.stop()

    def test_read_only_bucket_check_never_mutates_objects(self):
        client = storage.SupabaseStorage()
        client.verify_buckets()
        self.assertEqual(self.http.objects, {})
        self.assertTrue(all(method == "GET" for method, *_ in self.http.calls))

    def test_bucket_visibility_mismatch_fails(self):
        with patch.object(storage.requests, "request", return_value=Response(value={"public": True})):
            with self.assertRaises(storage.StorageError):
                storage.SupabaseStorage().verify_buckets()

    def test_credentials_never_sent_as_bearer_or_to_anonymous_reader(self):
        client = storage.SupabaseStorage()
        client.upload("report-images", "a.png", PNG, "image/png")
        self.assertEqual(client.download_public("report-images", "a.png"), PNG)
        for method, url, kw in self.http.calls:
            self.assertTrue(url.startswith(ENV["SUPABASE_URL"] + "/storage/v1/"))
            self.assertFalse(kw["allow_redirects"])
            self.assertNotIn("Authorization", kw["headers"])
            self.assertNotIn(ENV["SUPABASE_SECRET_KEY"], url)
            self.assertNotEqual(kw.get("verify"), False)
        self.assertNotIn("apikey", self.http.calls[-1][2]["headers"])

    def test_credentials_require_secret_key_and_trusted_https_project(self):
        for invalid in ("http://exampleproject.supabase.co", "https://attacker.example",
                        "https://exampleproject.supabase.co@attacker.example",
                        "https://exampleproject.supabase.co/?key=x"):
            with patch.dict(os.environ, {"SUPABASE_URL": invalid}):
                with self.assertRaises(storage.StorageError):
                    storage.SupabaseStorage()
        with patch.dict(os.environ, {"SUPABASE_SECRET_KEY": "sb_publishable_wrong_key"}):
            with self.assertRaises(storage.StorageError):
                storage.SupabaseStorage()
        self.assertEqual(self.http.calls, [])

    def test_existing_article_reader_keeps_big_ids_and_korean_text(self):
        from utils.firebase_utils import fetch_article_content
        article_id = 9007199254740993
        raw = json.dumps({"content": "기사 본문 연결 확인"}, ensure_ascii=False).encode("utf-8")
        self.http.objects["articles", f"{article_id}.json"] = raw
        bucket = storage.SupabaseArticleBucket()
        self.assertEqual(bucket.blob(f"articles/{article_id}.json").download_as_bytes(), raw)
        self.assertEqual(fetch_article_content([str(article_id)], bucket), [{article_id: "기사 본문 연결 확인"}])
        with self.assertRaises(storage.StorageError):
            bucket.blob("articles/../secret")

    def test_report_image_is_public_url_fitting_existing_schema(self):
        image_data = "data:image/png;base64," + base64.b64encode(PNG).decode()
        url = storage.upload_report_image(image_data, 9007199254740993)
        self.assertLessEqual(len(url), 255)
        self.assertIn("/object/public/report-images/images/9007199254740993-", url)
        self.assertNotIn(ENV["SUPABASE_SECRET_KEY"], url)
        self.assertEqual(list(self.http.objects.values()), [PNG])
        with self.assertRaises(storage.StorageError):
            storage.upload_report_image("data:image/png;base64,invalid!", 1)

    def test_provider_errors_are_sanitized_without_key_or_body(self):
        poisoned = ENV["SUPABASE_SECRET_KEY"]
        with patch.object(storage.requests, "request", side_effect=storage.requests.RequestException(poisoned)):
            with self.assertRaises(storage.StorageError) as result:
                storage.SupabaseStorage().verify_buckets()
            self.assertNotIn(poisoned, str(result.exception))
        with patch.object(storage.requests, "request", return_value=Response(status=403, content=poisoned.encode())):
            with self.assertRaises(storage.StorageError) as result:
                storage.SupabaseStorage().verify_buckets()
            self.assertEqual(result.exception.status_code, 403)
            self.assertNotIn(poisoned, str(result.exception))

    def test_explicit_write_probe_cleans_only_its_temporary_objects(self):
        self.http.objects["articles", "existing.json"] = b"existing"
        with contextlib.redirect_stdout(io.StringIO()):
            write_probe(storage.SupabaseStorage())
        self.assertEqual(self.http.objects, {("articles", "existing.json"): b"existing"})
        deleted = [kw["json"]["prefixes"] for method, _, kw in self.http.calls if method == "DELETE"]
        self.assertTrue(all(paths[0].startswith("_connection-check/") for paths in deleted))

    def test_original_firebase_provider_retains_token_url(self):
        blob = types.SimpleNamespace(metadata={"firebaseStorageDownloadTokens": "old-token"})
        blob.upload_from_string = lambda data, content_type: None
        bucket = types.SimpleNamespace(name="legacy.appspot.com", blob=lambda name: blob)
        fake = types.ModuleType("firebase_admin")
        fake.storage = types.SimpleNamespace(bucket=lambda: bucket)
        with patch.dict(os.environ, {"STORAGE_PROVIDER": "firebase"}), patch.dict(sys.modules, {"firebase_admin": fake}):
            image_data = "data:image/png;base64," + base64.b64encode(PNG).decode()
            url = storage.upload_report_image(image_data, 42)
            self.assertIn("legacy.appspot.com/o/images%2F42.png?alt=media&token=old-token", url)

    def test_existing_save_report_route_keeps_database_and_response_contract(self):
        statements = []
        cursor = types.SimpleNamespace(
            execute=lambda sql, values: statements.append((sql, values)),
            executemany=lambda sql, values: statements.append((sql, values)), close=lambda: None)
        committed = []
        connection = types.SimpleNamespace(open=True, cursor=lambda: cursor, commit=lambda: committed.append(True), close=lambda: None)
        fake_db = types.ModuleType("db.db_config")
        fake_db.database_config = {}
        fake_db.get_db_connection = lambda config: connection
        spec = importlib.util.spec_from_file_location("storage_test_save_route", Path(__file__).resolve().parents[1] / "routers/saveReportRouter.py")
        module = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {"db.db_config": fake_db, "storage_test_save_route": module}):
            spec.loader.exec_module(module)
            data = module.ReportData(user_id="test-user", title="title", content="report",
                                     image="data:image/png;base64," + base64.b64encode(PNG).decode(),
                                     art_ids=["9007199254740993"])
            result = asyncio.run(module.save_report(data))
        self.assertEqual(result["message"], "Report saved successfully")
        self.assertEqual(statements[0][1][4], "test-user")
        self.assertEqual(statements[0][1][5], result["image_url"])
        self.assertEqual(statements[1][1][0][1], 9007199254740993)
        self.assertEqual(committed, [True])


if __name__ == "__main__":
    unittest.main()
