"""Offline regressions for news filter combinations and missing body objects."""
import gzip
import importlib.util
import json
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import Mock, patch


class SearchTests(unittest.TestCase):
    def setUp(self):
        self.index = {"ai": [1, "2", 3], "교육": [2, 4], "의료": [3]}
        outer = self
        class Firestore:
            def collection(self, _): return self
            def document(self, key): self.key = key; return self
            def get(self, **kwargs):
                values = outer.index.get(self.key)
                return types.SimpleNamespace(exists=values is not None,
                    to_dict=lambda: {"article_ids": values} if values is not None else None)
        settings = types.ModuleType("db.settings")
        settings.database_config = {}
        db = types.ModuleType("db.db_config")
        self.connection = Mock(open=True)
        db.get_db_connection = Mock(return_value=self.connection)
        firebase = types.ModuleType("db.firebase_config")
        firebase.fire_db, firebase.bucket = Firestore(), Mock()
        queries = types.ModuleType("utils.mysql_querys")
        queries.all_query = Mock(return_value=[])
        path = Path(__file__).resolve().parents[1] / "services/search_service.py"
        spec = importlib.util.spec_from_file_location("news_search_under_test", path)
        self.service = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {"db.settings": settings, "db.db_config": db,
                                     "db.firebase_config": firebase, "utils.mysql_querys": queries}):
            spec.loader.exec_module(self.service)

    def test_missing_and_term_cannot_reset_or_skip_intersection(self):
        for terms in (["missing", "ai"], ["ai", "missing"], ["ai", "missing", "교육"]):
            self.assertIsNone(self.service.search_by_fireindex({"andKeywords": terms}))
        self.assertIsNone(self.service.search_by_fireindex({"andKeywords": ["교육", "의료", "ai"]}))

    def test_all_mandatory_terms_and_optional_group_are_respected(self):
        self.assertEqual(self.service.search_by_fireindex({"andKeywords": ["AI"], "orKeywords": ["교육"]}), {2})
        self.assertEqual(self.service.search_by_fireindex({"andKeywords": ["ai", "교육"]}), {2})
        self.assertEqual(self.service.search_by_fireindex({"orKeywords": ["교육", "의료"]}), {2, 3, 4})

    def test_excluded_keyword_is_removed_from_or_results(self):
        self.assertEqual(self.service.search_by_fireindex({"orKeywords": ["ai"], "notKeywords": ["교육"]}), {1, 3})

    def test_no_matches_does_not_open_db_connection(self):
        result = self.service.search_by_keyword_and_date({"orKeywords": ["missing"]})
        self.assertIn("message", result)
        self.service.get_db_connection.assert_not_called()

    def test_date_only_with_empty_keyword_groups_still_queries(self):
        self.service.search_by_keyword_and_date({"andKeywords": [], "orKeywords": [], "notKeywords": []}, ["2026-01-01", "2026-12-31"])
        self.service.all_query.assert_called_once_with([], ["2026-01-01", "2026-12-31"], self.connection)
        self.connection.close.assert_called_once()

    def test_connection_closes_if_query_raises(self):
        self.service.all_query.side_effect = RuntimeError("offline query failure")
        with self.assertRaises(RuntimeError):
            self.service.search_by_keyword_and_date({"orKeywords": ["ai"]})
        self.connection.close.assert_called_once()

    def test_one_missing_object_does_not_shift_later_article_body(self):
        self.service.all_query.return_value = [{"cr_art_id": 1}, {"cr_art_id": 2}]
        missing = Mock()
        missing.download_as_text.side_effect = FileNotFoundError()
        found = Mock()
        found.download_as_text.return_value = json.dumps({"content": "second article body"})
        self.service.bucket.blob.side_effect = [missing, found]
        response = self.service.search_by_keyword_and_date({"orKeywords": ["ai"]})
        rows = json.loads(gzip.decompress(response))
        self.assertEqual(rows[0]["cr_art_content"], "Content not available.")
        self.assertEqual(rows[1], {"cr_art_id": "2", "cr_art_content": "second article body"})


if __name__ == "__main__":
    unittest.main()
