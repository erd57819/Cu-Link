"""Offline ingestion tests: source boundaries, conflicts and interrupted reruns."""
from copy import deepcopy
from datetime import datetime
import json
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import import_policy_news as news


def fixture(license=True):
    notice = news.LICENSE if license else "All rights reserved"
    return ('<html><h1>인공지능 교육 정책 기사</h1>'
            '<script type="application/ld+json">{"datePublished":"2026-11-11T18:27:00+09:00"}</script>'
            '<div class="article_head"><a class="gotosite">교육부</a></div>'
            '<div class="view_cont"><p>' + ('테스트용 인공지능 교육 본문입니다. ' * 30) + '</p>'
            '<figure><img src="photo.jpg"><figcaption>PHOTO CAPTION</figcaption></figure>'
            '<p>문의: 000-0000</p></div><span>' + notice + '</span></html>')


class Response:
    def __init__(self, value): self.value = value
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def json(self): return self.value


class Storage:
    article_bucket = "articles"
    def __init__(self): self.objects, self.uploads = {}, 0
    def verify_buckets(self): pass
    def _request(self, method, endpoint, *, json_body):
        names = sorted(n for n in self.objects if json_body["search"] in n)
        start = json_body["offset"]
        return Response([{"name": n} for n in names[start:start + json_body["limit"]]])
    def download(self, bucket, path): return self.objects[path]
    def upload(self, bucket, path, data, content_type):
        if path in self.objects: raise AssertionError("overwrite attempted")
        self.objects[path] = data
        self.uploads += 1


class Database:
    def __init__(self, rows): self.rows, self.pending, self.result = rows, {}, None
    def cursor(self): return self
    def __enter__(self): return self
    def __exit__(self, *args): pass
    def execute(self, query, params):
        if query.startswith("SELECT"):
            self.result = self.rows.get(params[0])
        elif query.startswith("INSERT"):
            ident, title, image, url, company, date = params
            if ident in self.rows: raise AssertionError("duplicate insert attempted")
            self.pending[ident] = {"cr_art_title": title, "cr_art_url": url, "cr_art_date": date}
        else: raise AssertionError(query)
    def fetchone(self): return self.result
    def commit(self): self.rows.update(self.pending); self.pending.clear()
    def rollback(self): self.pending.clear()
    def close(self): self.rollback()


class Firestore:
    def __init__(self): self.index, self.fail_once = {}, False
    def collection(self, name):
        assert name == "keyword_index"
        return self
    def document(self, name): return name
    def batch(self):
        outer = self
        class Batch:
            def __init__(self): self.pending = []
            def set(self, ref, value, merge):
                assert merge is True
                self.pending.append((ref, value["article_ids"]))
            def commit(self, **kwargs):
                if outer.fail_once:
                    outer.fail_once = False
                    raise TimeoutError("simulated interruption after DB and body save")
                for key, values in self.pending:
                    outer.index.setdefault(key, set()).update(values)
        return Batch()
    def get_all(self, refs, **kwargs):
        for key in refs:
            yield types.SimpleNamespace(id=key, to_dict=lambda key=key: {"article_ids": list(self.index.get(key, []))})


class ImportTests(unittest.TestCase):
    def setUp(self):
        self.article = news.parse_article("148975521", fixture())
        self.storage, self.rows, self.firestore = Storage(), {}, Firestore()

    def import_with_fakes(self, articles):
        db = types.ModuleType("db.db_config")
        db.database_config = {}
        db.get_db_connection = lambda config: Database(self.rows)
        firebase = types.ModuleType("db.firebase_config")
        firebase.fire_db = self.firestore
        with patch.dict(sys.modules, {"db.db_config": db, "db.firebase_config": firebase}), \
             patch("services.object_storage.SupabaseStorage", return_value=self.storage), \
             patch("services.object_storage.storage_provider", return_value="supabase"), \
             patch("firebase_admin.firestore.ArrayUnion", side_effect=lambda values: values):
            news.import_articles(articles)

    def test_source_text_only_attribution_original_date_and_stable_id(self):
        a = self.article
        self.assertEqual(a["date"], datetime(2026, 11, 11, 18, 27))
        self.assertLess(a["id"], 2**53)
        self.assertIn(a["url"], a["payload"]["content"])
        self.assertIn("교육부", a["payload"]["content"])
        self.assertNotIn("PHOTO CAPTION", a["payload"]["content"])
        self.assertNotIn("문의:", a["payload"]["content"])
        self.assertIn("인공지능", a["keywords"])
        self.assertIn("ai", a["keywords"])
        with self.assertRaises(news.ImportFailure):
            news.parse_article("148975521", fixture(license=False))

    def test_interruption_then_rerun_repairs_index_without_duplicates(self):
        # Preserve an unrelated article already registered under the same keyword.
        self.firestore.index["ai"] = {123}
        self.firestore.fail_once = True
        with self.assertRaises(TimeoutError):
            self.import_with_fakes([self.article])
        self.assertEqual(len(self.rows), 1)
        self.assertEqual(self.storage.uploads, 1)
        self.import_with_fakes([self.article])
        self.import_with_fakes([self.article])
        self.assertEqual(len(self.rows), 1)
        self.assertEqual(self.storage.uploads, 1)
        self.assertEqual(self.firestore.index["ai"], {123, self.article["id"]})

    def test_existing_storage_conflict_aborts_whole_plan_before_writing(self):
        other = news.parse_article("148974652", fixture())
        self.storage.objects[f"{other['id']}.json"] = b'{"content":"unrelated existing data"}'
        before = deepcopy(self.storage.objects)
        with self.assertRaises(news.ImportFailure):
            self.import_with_fakes([self.article, other])
        self.assertEqual(self.rows, {})
        self.assertEqual(self.firestore.index, {})
        self.assertEqual(self.storage.objects, before)
        self.assertEqual(self.storage.uploads, 0)

    def test_db_id_collision_does_not_overwrite_row(self):
        self.rows[self.article["id"]] = {"cr_art_url": "https://unrelated.example", "cr_art_title": "existing", "cr_art_date": datetime(2020, 1, 1)}
        before = deepcopy(self.rows)
        with self.assertRaises(news.ImportFailure):
            self.import_with_fakes([self.article])
        self.assertEqual(self.rows, before)
        self.assertEqual(self.storage.objects, {})

    def test_changed_source_requires_review_instead_of_overwrite(self):
        self.import_with_fakes([self.article])
        changed = deepcopy(self.article)
        changed["payload"]["content"] += " updated source"
        with self.assertRaises(news.ImportFailure):
            self.import_with_fakes([changed])
        original = json.loads(self.storage.objects[f"{self.article['id']}.json"])
        self.assertEqual(original["content"], self.article["payload"]["content"])


if __name__ == "__main__":
    unittest.main()
