"""Read-only bucket check; --write-test explicitly tests new temporary objects."""
import argparse
import base64
import json
import sys
import uuid

from services.object_storage import StorageError, SupabaseStorage

# A tiny PNG, containing no application or user data.
PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRz8AAAAASUVORK5CYII="
)


def write_probe(client):
    suffix = uuid.uuid4().hex
    article_path = f"_connection-check/{suffix}.json"
    image_path = f"_connection-check/{suffix}.png"
    cleanup = []
    try:
        data = json.dumps({"content": "Cu-Link storage connection check"}).encode("utf-8")
        cleanup.append((client.article_bucket, article_path))
        client.upload(client.article_bucket, article_path, data, "application/json")
        if client.download(client.article_bucket, article_path) != data:
            raise StorageError("Article upload/download verification failed")
        try:
            client.download_public(client.article_bucket, article_path)
        except StorageError as error:
            if error.status_code not in {400, 401, 403, 404}:
                raise
        else:
            raise StorageError("Private article was readable without credentials")
        print("[OK] Private article: upload / authenticated read / anonymous access denied")

        cleanup.append((client.image_bucket, image_path))
        client.upload(client.image_bucket, image_path, PNG, "image/png")
        if client.download_public(client.image_bucket, image_path) != PNG:
            raise StorageError("Public image download verification failed")
        print("[OK] Report image: upload / public read")
    finally:
        failed = False
        for bucket, path in cleanup:
            try:
                client.delete(bucket, path)
            except StorageError:
                failed = True
                # These paths identify only the unique test files, never credentials.
                print(f"[CLEANUP REQUIRED] {bucket}/{path}")
        if failed:
            raise StorageError("Remove only the listed temporary check files in Storage")
        if cleanup:
            print("[OK] Temporary check objects cleaned up; existing files were not changed")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write-test", action="store_true",
                        help="Create, read and delete uniquely named temporary JSON/PNG files")
    args = parser.parse_args()
    try:
        client = SupabaseStorage()
        client.verify_buckets()
        print("[OK] Supabase: articles bucket private / report images bucket public")
        if args.write_test:
            write_probe(client)
        else:
            print("Read-only check complete. No objects were created or changed.")
        return 0
    except StorageError as error:
        print(f"[FAIL] {error}")
        return 1
    except Exception as error:
        print(f"[FAIL] {type(error).__name__}; check local dependencies and settings")
        return 1


if __name__ == "__main__":
    sys.exit(main())
