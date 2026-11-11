import os
import unittest
from unittest.mock import Mock, patch

import requests

from services.text_ai import BASE_URL, MODEL, TextAIError, chat_completion, check_model
from models.summary_openai import summarize_article
from models.report_openai import createReport_openAI
from models.chatbot_openai import get_chatbot_response


def response(content="정상 응답", status=200, finish="stop"):
    result = Mock(status_code=status)
    result.__enter__ = Mock(return_value=result)
    result.__exit__ = Mock(return_value=False)
    result.json.return_value = {"choices": [{"message": {"content": content}, "finish_reason": finish}]}
    return result


class GeminiTests(unittest.TestCase):
    def setUp(self):
        env = patch.dict(os.environ, {"GEMINI_API_KEY": "test-google-key", "GEMINI_MODEL": MODEL,
                                      "OPEN_API_KEY": "sk-unused-test"})
        env.start()
        self.addCleanup(env.stop)

    @patch("services.text_ai.requests.request")
    def test_model_check_is_read_only(self, request):
        r = response()
        r.json.return_value = {"name": "models/" + MODEL, "supportedGenerationMethods": ["generateContent"]}
        request.return_value = r
        check_model()
        request.assert_called_once()
        self.assertEqual(request.call_args.args, ("GET", BASE_URL + "/models/" + MODEL))

    @patch("services.text_ai.requests.request")
    def test_summary_keeps_article_and_existing_output_format(self, request):
        request.return_value = response("첫 번째 문장. 두 번째 문장.")
        summary = summarize_article("지정한 기사 원문")
        self.assertEqual(summary, "첫 번째 문장.\n두 번째 문장.")
        args = request.call_args
        self.assertEqual(args.args, ("POST", BASE_URL + "/openai/chat/completions"))
        self.assertIn("지정한 기사 원문", args.kwargs["json"]["messages"][1]["content"])
        self.assertEqual(args.kwargs["headers"], {"Authorization": "Bearer test-google-key"})
        self.assertEqual(args.kwargs["json"]["model"], MODEL)
        self.assertEqual(args.kwargs["json"]["reasoning_effort"], "low")
        self.assertFalse(args.kwargs["allow_redirects"])
        self.assertNotIn("sk-unused-test", str(args))

    @patch("services.text_ai.requests.request")
    def test_three_reports_all_include_articles_and_keep_response_shape(self, request):
        request.side_effect = [response("제목 1\n본문 1"), response("제목 2\n본문 2"),
                               response("제목 3\n본문 3"), response("이미지 생성용 문장")]
        result = createReport_openAI("검증용 기사 본문")
        self.assertEqual(result, {"reports": ["제목 1\n본문 1", "제목 2\n본문 2", "제목 3\n본문 3"],
                                  "titles": ["제목 1", "제목 2", "제목 3"], "img_txt": "이미지 생성용 문장"})
        self.assertEqual(request.call_count, 4)
        for call in request.call_args_list[:3]:
            self.assertIn("검증용 기사 본문", call.kwargs["json"]["messages"][1]["content"])

    @patch("services.text_ai.requests.request")
    def test_chatbot_keeps_site_instructions_and_returns_string(self, request):
        request.return_value = response("기사 검색부터 시작하세요.")
        self.assertEqual(get_chatbot_response("사용법 알려줘"), "기사 검색부터 시작하세요.")
        prompt = request.call_args.kwargs["json"]["messages"][0]["content"]
        self.assertIn("사용법 알려줘", prompt)
        self.assertIn("최대 6개의 뉴스", prompt)

    @patch("services.text_ai.requests.request")
    def test_quota_error_not_retried_or_replaced_with_openai(self, request):
        request.return_value = response(status=429)
        with self.assertRaises(TextAIError) as error:
            chat_completion(messages=[{"role": "user", "content": "text"}])
        self.assertEqual(error.exception.status_code, 429)
        self.assertNotIn("test-google-key", str(error.exception))
        self.assertEqual(request.call_count, 1)

    @patch("services.text_ai.requests.request")
    def test_missing_key_does_not_use_openai_key(self, request):
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}):
            with self.assertRaisesRegex(TextAIError, "GEMINI_API_KEY"):
                chat_completion(messages=[{"role": "user", "content": "text"}])
        request.assert_not_called()

    @patch("services.text_ai.requests.request")
    def test_other_model_rejected_before_network(self, request):
        with patch.dict(os.environ, {"GEMINI_MODEL": "unreviewed-paid-model"}):
            with self.assertRaisesRegex(TextAIError, "only"):
                check_model()
        request.assert_not_called()

    @patch("services.text_ai.requests.request")
    def test_raw_provider_error_body_never_exposed(self, request):
        r = response(status=403)
        r.text = "secret API key and provider details"
        request.return_value = r
        with self.assertRaises(TextAIError) as error:
            check_model()
        self.assertNotIn("secret API key", str(error.exception))
        self.assertIn("verification", str(error.exception))

    @patch("services.text_ai.requests.request")
    def test_incomplete_and_empty_outputs_not_accepted(self, request):
        for r in (response("partial", finish="length"), response("", finish="stop"), response("", finish="content_filter")):
            request.return_value = r
            with self.assertRaises(TextAIError):
                chat_completion(messages=[{"role": "user", "content": "text"}])

    @patch("services.text_ai.requests.request")
    def test_report_quota_error_propagates_instead_of_returning_error_dict(self, request):
        request.return_value = response(status=429)
        with self.assertRaises(TextAIError) as error:
            createReport_openAI("article")
        self.assertEqual(error.exception.status_code, 429)

    @patch("services.text_ai.requests.request")
    def test_bad_report_layout_rejected_before_image_prompt_request(self, request):
        request.return_value = response("본문만 있고 제목 줄바꿈이 없음")
        with self.assertRaisesRegex(TextAIError, "title and body"):
            createReport_openAI("article")
        self.assertEqual(request.call_count, 1)

    @patch("services.text_ai.requests.request")
    def test_timeout_sanitized_without_retry(self, request):
        request.side_effect = requests.Timeout("test-google-key")
        with self.assertRaises(TextAIError) as error:
            check_model()
        self.assertNotIn("test-google-key", str(error.exception))
        self.assertEqual(error.exception.status_code, 504)
        self.assertEqual(request.call_count, 1)


if __name__ == "__main__":
    unittest.main()
