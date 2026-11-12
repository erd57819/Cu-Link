"""Article read regressions. No credentials or external APIs are used."""
import json
import threading
import unittest
from unittest.mock import Mock, patch

from services.article_bodies import ArticleBodyReader, MISSING_CONTENT


class ArticleBodyTests(unittest.TestCase):
    def setUp(self):
        self.reader = ArticleBodyReader(workers=3, ttl=10, max_entries=2)
        self.addCleanup(self.reader.executor.shutdown, wait=True)
        self.bucket = Mock()
        self.bucket.blob.side_effect = lambda path: Mock(
            download_as_text=lambda: json.dumps({"content": path}))

    def test_downloads_overlap_and_keep_id_mapping(self):
        barrier = threading.Barrier(3)
        def download(bucket, article_id):
            barrier.wait(timeout=3)
            return str(article_id)
        with patch.object(self.reader, "_download", side_effect=download):
            result = self.reader.get_many(self.bucket, [3, 1, 2, 3])
        self.assertEqual(list(result.items()), [(3, "3"), (1, "1"), (2, "2")])

    def test_successful_body_is_reused_until_ttl_expires(self):
        with patch("services.article_bodies.time.monotonic", return_value=0):
            first = self.reader.get_many(self.bucket, [1])
        with patch("services.article_bodies.time.monotonic", return_value=9):
            self.assertEqual(self.reader.get_many(self.bucket, [1]), first)
        self.assertEqual(self.bucket.blob.call_count, 1)
        with patch("services.article_bodies.time.monotonic", return_value=11):
            self.reader.get_many(self.bucket, [1])
        self.assertEqual(self.bucket.blob.call_count, 2)

    def test_failed_download_does_not_cache_or_shift_other_body(self):
        def blob(path):
            if path == "articles/1.json":
                raise OSError("offline fixture failure")
            return Mock(download_as_text=lambda: '{"content":"second body"}')
        self.bucket.blob.side_effect = blob
        expected = {1: MISSING_CONTENT, 2: "second body"}
        self.assertEqual(self.reader.get_many(self.bucket, [1, 2]), expected)
        self.assertEqual(self.reader.get_many(self.bucket, [1, 2]), expected)
        self.assertEqual(self.bucket.blob.call_count, 3)

    def test_missing_or_invalid_json_content_is_not_cached(self):
        self.bucket.blob.return_value = Mock(download_as_text=lambda: '{"content":null}')
        self.bucket.blob.side_effect = None
        for _ in range(2):
            self.assertEqual(self.reader.get_many(self.bucket, [1]), {1: MISSING_CONTENT})
        self.assertEqual(self.bucket.blob.call_count, 2)

    def test_cache_is_bounded_and_evicts_oldest_body(self):
        self.reader.get_many(self.bucket, [1, 2])
        self.reader.get_many(self.bucket, [1])
        self.reader.get_many(self.bucket, [3])
        self.reader.get_many(self.bucket, [1])
        self.assertEqual(self.bucket.blob.call_count, 3)
        self.reader.get_many(self.bucket, [2])
        self.assertEqual(self.bucket.blob.call_count, 4)
        self.assertEqual(len(self.reader.cache), 2)

    def test_concurrent_requests_share_one_download(self):
        entered, release = threading.Event(), threading.Event()
        def download(bucket, article_id):
            entered.set()
            if not release.wait(timeout=3):
                raise TimeoutError("fixture not released")
            return "shared body"
        results = []
        with patch.object(self.reader, "_download", side_effect=download) as fetch:
            threads = [threading.Thread(target=lambda: results.append(
                self.reader.get_many(self.bucket, [1]))) for _ in range(2)]
            for thread in threads:
                thread.start()
            self.assertTrue(entered.wait(timeout=3))
            release.set()
            for thread in threads:
                thread.join(timeout=3)
                self.assertFalse(thread.is_alive())
            self.assertEqual(fetch.call_count, 1)
        self.assertEqual(results, [{1: "shared body"}] * 2)

    def test_cache_does_not_cross_storage_instances(self):
        self.reader.get_many(self.bucket, [1])
        other = Mock()
        other.blob.return_value.download_as_text.return_value = '{"content":"other"}'
        self.assertEqual(self.reader.get_many(other, [1]), {1: "other"})


if __name__ == "__main__":
    unittest.main()
