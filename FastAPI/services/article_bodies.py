"""Bounded parallel reads of article bodies; no user or report data is cached."""
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor
import json
import threading
import time


MISSING_CONTENT = "Content not available."


class ArticleBodyReader:
    def __init__(self, workers=6, ttl=300, max_entries=256):
        self.executor = ThreadPoolExecutor(max_workers=workers, thread_name_prefix="article-body")
        self.ttl = ttl
        self.max_entries = max_entries
        self.cache = OrderedDict()
        self.pending = {}
        self.lock = threading.Lock()

    @staticmethod
    def _download(bucket, article_id):
        body = bucket.blob(f"articles/{article_id}.json").download_as_text()
        content = json.loads(body).get("content")
        if not isinstance(content, str):
            raise ValueError("Article content is unavailable")
        return content

    def get_many(self, bucket, article_ids):
        ids = list(dict.fromkeys(int(value) for value in article_ids))
        results, waiting = {}, {}
        with self.lock:
            now = time.monotonic()
            for article_id in ids:
                key = (bucket, article_id)
                cached = self.cache.get(key)
                if cached is not None and cached[0] > now:
                    self.cache.move_to_end(key)
                    results[article_id] = cached[1]
                    continue
                self.cache.pop(key, None)
                future = self.pending.get(key)
                if future is None:
                    future = self.executor.submit(self._download, bucket, article_id)
                    self.pending[key] = future
                waiting[article_id] = (key, future)

        for article_id, (key, future) in waiting.items():
            try:
                content = future.result()
            except Exception:
                # A failed download must not poison the cache or shift other bodies.
                results[article_id] = MISSING_CONTENT
                with self.lock:
                    if self.pending.get(key) is future:
                        del self.pending[key]
            else:
                results[article_id] = content
                with self.lock:
                    if self.pending.get(key) is future:
                        del self.pending[key]
                        self.cache[key] = (time.monotonic() + self.ttl, content)
                        self.cache.move_to_end(key)
                        while len(self.cache) > self.max_entries:
                            self.cache.popitem(last=False)
        return {article_id: results[article_id] for article_id in ids}


article_body_reader = ArticleBodyReader()
