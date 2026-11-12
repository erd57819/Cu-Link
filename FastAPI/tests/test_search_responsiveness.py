"""A storage-bound search must leave other API requests responsive."""
import asyncio
import gzip
import importlib.util
from pathlib import Path
import sys
import threading
import types
import unittest
from unittest.mock import patch

import httpx
from fastapi import FastAPI


class SearchResponsivenessTests(unittest.IsolatedAsyncioTestCase):
    async def test_other_requests_continue_while_search_waits_for_storage(self):
        entered, release, finished = threading.Event(), threading.Event(), threading.Event()
        def slow_search(*args):
            entered.set()
            release.wait(timeout=3)
            finished.set()
            return gzip.compress(b"[]")
        fake_service = types.ModuleType("services.search_service")
        fake_service.search_by_keyword_and_date = slow_search
        path = Path(__file__).resolve().parents[1] / "routers/searchRouter.py"
        spec = importlib.util.spec_from_file_location("responsive_search_router", path)
        module = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {"services.search_service": fake_service}):
            spec.loader.exec_module(module)
        app = FastAPI()
        app.include_router(module.router)
        @app.get("/probe")
        async def probe():
            return {"ok": True}
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            request = asyncio.create_task(client.post("/keywords", json={
                "keywords": {"orKeywords": ["fixture"]}, "dateRange": []}))
            try:
                for _ in range(100):
                    if entered.is_set():
                        break
                    await asyncio.sleep(0.01)
                self.assertTrue(entered.is_set())
                response = await asyncio.wait_for(client.get("/probe"), timeout=1)
                self.assertEqual(response.status_code, 200)
                self.assertFalse(finished.is_set(), "Search blocked the event loop")
            finally:
                release.set()
                self.assertEqual((await request).status_code, 200)


if __name__ == "__main__":
    unittest.main()
