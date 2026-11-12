"""Use real PyMySQL close semantics without any network or AI requests."""
import gzip
import importlib.util
import json
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import MagicMock, Mock, patch

import pymysql


class ReportConnectionTests(unittest.TestCase):
    def setUp(self):
        self.connection = pymysql.connect(defer_connect=True)
        # A fake socket allows the real close implementation to run offline.
        self.connection._sock = Mock()
        self.ai = Mock(return_value={"titles": ["title"], "reports": ["body"], "img_txt": "prompt"})
        self.images = Mock(return_value=[])
        self.body = Mock(return_value=[{1: "stored article body"}])
        settings = types.ModuleType("db.settings")
        settings.database_config = {}
        db = types.ModuleType("db.db_config")
        db.get_db_connection = Mock(return_value=self.connection)
        firebase = types.ModuleType("db.firebase_config")
        firebase.bucket = Mock()
        queries = types.ModuleType("utils.mysql_querys")
        queries.query_metadata_from_db = Mock(side_effect=self.helper_closes_connection)
        self.query = queries.query_metadata_from_db
        utils = types.ModuleType("utils.firebase_utils")
        utils.fetch_article_content = self.body
        model = types.ModuleType("models.report_openai")
        model.createReport_openAI = self.ai
        images = types.ModuleType("models.textToImage")
        images.generate_images_and_send = self.images
        spec = importlib.util.spec_from_file_location("report_connection_under_test", Path(__file__).resolve().parents[1] / "services/report_service.py")
        self.service = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {"db.settings": settings, "db.db_config": db,
                "db.firebase_config": firebase, "utils.mysql_querys": queries,
                "utils.firebase_utils": utils, "models.report_openai": model,
                "models.textToImage": images}):
            spec.loader.exec_module(self.service)

    def helper_closes_connection(self, ids, connection):
        connection.close()
        return [{"cr_art_id": 1}]

    def tearDown(self):
        if self.connection.open:
            self.connection.close()

    def test_closed_helper_connection_does_not_block_report_response(self):
        def generate(contents):
            self.assertFalse(self.connection.open)
            return {"titles": ["title"], "reports": ["body"], "img_txt": "prompt"}
        self.ai.side_effect = generate
        result = json.loads(gzip.decompress(self.service.createReport_services([1])))
        self.assertEqual(result["metadata"], [{"cr_art_id": 1}])
        self.assertEqual(result["report_data"], ["body"])
        self.ai.assert_called_once()
        self.images.assert_not_called()

    def test_error_before_helper_cleanup_still_closes_connection(self):
        self.query.side_effect = RuntimeError("original metadata failure")
        with self.assertRaisesRegex(RuntimeError, "original metadata failure"):
            self.service.createReport_services([1])
        self.assertFalse(self.connection.open)
        self.ai.assert_not_called()

    def test_error_after_helper_cleanup_is_not_masked_by_second_close(self):
        def failure(ids, connection):
            connection.close()
            raise RuntimeError("original metadata failure")
        self.query.side_effect = failure
        with self.assertRaisesRegex(RuntimeError, "original metadata failure"):
            self.service.createReport_services([1])
        self.ai.assert_not_called()


if __name__ == "__main__":
    unittest.main()
