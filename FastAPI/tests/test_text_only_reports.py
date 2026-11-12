import gzip
import importlib.util
import json
import os
from pathlib import Path
import sys
import types
import unittest
from unittest.mock import MagicMock, Mock, patch

from fastapi import FastAPI
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from models import report_openai


def load_module(name, path, modules):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    with patch.dict(sys.modules, modules):
        spec.loader.exec_module(module)
    return module


def module(name, **attrs):
    result = types.ModuleType(name)
    result.__dict__.update(attrs)
    return result


class TextOnlyReports(unittest.TestCase):
    def setUp(self):
        self.connection = Mock(open=True)
        self.cursor = Mock()
        self.connection.cursor.return_value = self.cursor
        self.upload = Mock(return_value="https://example.test/old-image.png")
        self.db = module("db.db_config", database_config={}, get_db_connection=Mock(return_value=self.connection))
        self.settings = module("db.settings", database_config={})
        self.storage = module("services.object_storage", upload_report_image=self.upload, StorageError=RuntimeError)
        self.save = load_module("text_save_router", "routers/saveReportRouter.py", {
            "db.db_config": self.db, "services.object_storage": self.storage,
        })
        app = FastAPI()
        app.include_router(self.save.router)
        app.dependency_overrides[self.save.require_user] = lambda: 'test-user'
        self.client = TestClient(app)

    def test_null_empty_and_omitted_image_save_without_storage(self):
        for image in ({}, {"image": None}, {"image": ""}):
            with self.subTest(image=image):
                body = {"user_id": "test-user", "title": "제목", "content": "본문", "art_ids": ["4000148975484"], **image}
                response = self.client.post("/savereport", json=body)
                self.assertEqual(response.status_code, 200)
                self.assertIsInstance(response.json()['rep_id'], str)
                self.assertIsNone(response.json()["image_url"])
                self.assertIsNone(self.cursor.execute.call_args.args[1][-1])
                self.assertEqual(self.cursor.executemany.call_args.args[1][0][1], 4000148975484)
        self.upload.assert_not_called()
        self.assertEqual(self.connection.commit.call_count, 3)

    def test_existing_image_payload_remains_compatible(self):
        response = self.client.post("/savereport", json={"user_id": "test-user", "title": "old", "content": "body", "image": "old-base64"})
        self.assertEqual(response.status_code, 200)
        self.upload.assert_called_once()

    def test_saving_under_another_account_is_rejected_before_database_access(self):
        response = self.client.post('/savereport', json={'user_id': 'other-user', 'title': 'title', 'content': 'body'})
        self.assertEqual(response.status_code, 403)
        self.db.get_db_connection.assert_not_called()

    def test_a_direct_unauthenticated_save_is_rejected(self):
        app = FastAPI()
        app.include_router(self.save.router)
        response = TestClient(app).post('/savereport', json={'user_id': 'test-user', 'title': 'title', 'content': 'body'})
        self.assertEqual(response.status_code, 401)
        self.db.get_db_connection.assert_not_called()

    def test_database_failure_rolls_back_and_closes(self):
        self.cursor.execute.side_effect = RuntimeError("private DB error")
        response = self.client.post("/savereport", json={"user_id": "test-user", "title": "title", "content": "body"})
        self.assertEqual(response.status_code, 500)
        self.connection.rollback.assert_called_once()
        self.connection.close.assert_called_once()
        self.assertNotIn("private DB error", response.text)

    @patch.dict(os.environ, {"HUGGINGFACE_TOKEN": "", "GEMINI_API_KEY": "test-google-key", "GEMINI_MODEL": "gemini-3.5-flash-lite"})
    def test_real_generation_route_uses_three_text_calls_and_no_gpu(self):
        queries = module("utils.mysql_querys", query_metadata_from_db=Mock(return_value=[{"cr_art_id": 1}]))
        bodies = module("utils.firebase_utils", fetch_article_content=Mock(return_value=[{1: "검증용 기사 본문"}]))
        # Importing or calling this dependency would fail the request.
        images = module("models.textToImage", generate_images_and_send=Mock(side_effect=AssertionError("GPU must not run")))
        service = load_module("text_report_service", "services/report_service.py", {
            "db.settings": self.settings, "db.db_config": self.db,
            "db.firebase_config": module("db.firebase_config", bucket=Mock()),
            "utils.mysql_querys": queries, "utils.firebase_utils": bodies,
            "models.textToImage": images,
        })
        router = load_module("text_create_router", "routers/createReportRouter.py", {
            "services.report_service": service,
        })
        app = FastAPI()
        app.include_router(router.router, prefix="/report")
        responses = []
        for index in range(3):
            response = Mock(status_code=200)
            response.__enter__ = Mock(return_value=response)
            response.__exit__ = Mock(return_value=False)
            response.json.return_value = {"choices": [{"message": {"content": f"제목 {index}\n본문 {index}"}, "finish_reason": "stop"}]}
            responses.append(response)
        with patch("services.text_ai.requests.request", side_effect=responses) as request:
            response = TestClient(app).post("/report/createReport", json={"ids": [1]})
        self.assertEqual(response.status_code, 200)
        result = json.loads(gzip.decompress(response.content))
        self.assertEqual(len(result["report_data"]), 3)
        self.assertEqual(result["report_images"], [])
        self.assertEqual(request.call_count, 3)
        self.assertTrue(all("generativelanguage.googleapis.com" in call.args[1] for call in request.call_args_list))
        images.generate_images_and_send.assert_not_called()


if __name__ == "__main__":
    unittest.main()
