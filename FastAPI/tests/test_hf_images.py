import io
import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.hf_images import HfImageError, PARAMETERS, SPACE_URL, ZeroGpuImages


def response(*, status=200, data=None, lines=(), body=b""):
    result = Mock(status_code=status)
    result.__enter__ = Mock(return_value=result)
    result.__exit__ = Mock(return_value=False)
    result.json.return_value = data
    result.iter_lines.return_value = iter(lines)
    result.iter_content.return_value = iter([body])
    return result


class ImageTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {"HUGGINGFACE_TOKEN": "hf_test_not_a_real_secret", "HF_IMAGE_SIZE": "512"})
        self.env.start()
        self.addCleanup(self.env.stop)

    @patch("services.hf_images.requests.request")
    def test_read_only_auth_and_space_contract_no_submission(self, request):
        request.side_effect = [response(data={"name": "test-user"}), response(data={
            "named_endpoints": {"/infer": {"parameters": [{"parameter_name": p} for p in PARAMETERS]}}
        })]
        ZeroGpuImages().check_connection()
        self.assertEqual([call.args[0] for call in request.call_args_list], ["GET", "GET"])
        for call in request.call_args_list:
            self.assertFalse(call.kwargs["allow_redirects"])
            self.assertTrue(call.kwargs["headers"]["Authorization"].startswith("Bearer hf_"))
            self.assertNotIn("verify", call.kwargs)  # Requests' certificate validation stays enabled.

    @patch("services.hf_images.requests.request")
    def test_real_event_schema_and_png_conversion_no_download_token(self, request):
        buf = io.BytesIO()
        Image.new("RGB", (8, 8), "blue").save(buf, format="WEBP")
        request.side_effect = [
            response(data={"event_id": "abc123"}),
            response(lines=["event: heartbeat", "data: null", "", "event: complete",
                            "data: " + json.dumps([{"url": SPACE_URL + "/gradio_api/file=/tmp/test.webp"}, 42]), ""]),
            response(body=buf.getvalue()),
        ]
        png = ZeroGpuImages().generate("Blue cube")
        self.assertTrue(png.startswith(b"\x89PNG\r\n\x1a\n"))
        self.assertEqual(request.call_args_list[0].kwargs["json"]["data"], ["Blue cube", 0, True, 512, 512, 4])
        self.assertEqual(request.call_args_list[-1].kwargs["headers"], {})

    @patch("services.hf_images.requests.request")
    def test_quota_failure_not_retried_or_revealed(self, request):
        request.return_value = response(status=429, data={"token": os.environ["HUGGINGFACE_TOKEN"]})
        with self.assertRaises(HfImageError) as error:
            ZeroGpuImages().generate("Cube")
        self.assertIn("Quota", str(error.exception))
        self.assertNotIn(os.environ["HUGGINGFACE_TOKEN"], str(error.exception))
        self.assertEqual(request.call_count, 1)

    @patch("services.hf_images.requests.request")
    def test_provider_payment_error_never_falls_back(self, request):
        request.return_value = response(status=402)
        with self.assertRaisesRegex(HfImageError, "no paid fallback"):
            ZeroGpuImages().generate("Cube")
        self.assertEqual(request.call_count, 1)

    @patch("services.hf_images.requests.request")
    def test_invalid_token_and_untrusted_urls_rejected_before_network(self, request):
        client = ZeroGpuImages()
        for url in ("https://evil.example/image.png", "http://black-forest-labs-flux-1-schnell.hf.space/file=x",
                    "https://black-forest-labs-flux-1-schnell.hf.space@evil.example/file=x"):
            with self.assertRaises(HfImageError):
                client._download_png({"url": url})
        with patch.dict(os.environ, {"HUGGINGFACE_TOKEN": ""}):
            with self.assertRaises(HfImageError):
                ZeroGpuImages()
        request.assert_not_called()

    @patch("services.hf_images.requests.request")
    def test_json_error_body_is_not_accepted_as_an_image(self, request):
        request.return_value = response(body=b'{"error":"quota"}')
        with self.assertRaisesRegex(HfImageError, "not a valid"):
            ZeroGpuImages()._download_png({"url": SPACE_URL + "/gradio_api/file=x"})

    @patch("services.hf_images.requests.request")
    def test_queue_error_stops_after_single_submission(self, request):
        request.side_effect = [response(data={"event_id": "abc"}),
                               response(lines=["event: error", "data: \"private provider message\"", ""])]
        with self.assertRaises(HfImageError) as error:
            ZeroGpuImages().generate("Cube")
        self.assertNotIn("private provider message", str(error.exception))
        self.assertEqual(request.call_count, 2)

    @patch("services.hf_images.requests.request")
    def test_api_schema_change_detected(self, request):
        request.side_effect = [response(data={"name": "test"}), response(data={"named_endpoints": {}})]
        with self.assertRaisesRegex(HfImageError, "API changed"):
            ZeroGpuImages().check_connection()

    def test_existing_three_style_response_shape(self):
        from models import textToImage
        with patch.object(textToImage, "query", return_value=b"png-bytes") as query, \
                patch("requests.get") as external_get:
            images = textToImage.generate_images_and_send("Blue cube")
        external_get.assert_not_called()
        self.assertEqual([x["style"] for x in images], ["watercolor", "comic", "photorealistic"])
        self.assertTrue(all(set(x) == {"file_name", "style", "image_data"} for x in images))
        self.assertTrue(all(x["image_data"] == b"png-bytes" for x in images))
        self.assertEqual(query.call_count, 3)
        self.assertEqual([call.args[0]["inputs"] for call in query.call_args_list], [
            "Blue cube in watercolor style", "Blue cube in comic style", "Blue cube in photorealistic style"])

    def test_bad_translation_or_prompt_cannot_consume_gpu_quota(self):
        from models import textToImage
        prompts = [None, "", "한국의 인공지능 경쟁력", "x" * 601,
                   "MYMEMORY WARNING: YOU USED ALL AVAILABLE FREE TRANSLATIONS FOR TODAY.",
                   "QUERY LENGTH LIMIT EXCEEDED. MAX ALLOWED QUERY: 500 CHARS",
                   "<html>Service unavailable</html>"]
        with patch.object(textToImage, "query") as query, patch("requests.get") as external_get:
            for prompt in prompts:
                with self.subTest(prompt=prompt), self.assertRaises(HfImageError):
                    textToImage.generate_images_and_send(prompt)
        query.assert_not_called()
        external_get.assert_not_called()

    def test_missing_token_does_not_block_module_import_or_prompt_login(self):
        import importlib
        from models import textToImage
        with patch.dict(os.environ, {"HUGGINGFACE_TOKEN": ""}), \
                patch("services.hf_images.requests.request") as request:
            importlib.reload(textToImage)
            request.assert_not_called()


if __name__ == "__main__":
    unittest.main()
