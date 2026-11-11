"""Gemini text calls for existing Cu-Link routes; no OpenAI/paid fallback."""
import os
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SUPPORTED_MODELS = frozenset({"gemini-3.5-flash-lite", "gemini-3.8-flash"})
MODEL = (os.getenv("GEMINI_MODEL") or "gemini-3.5-flash-lite").strip()
BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


class TextAIError(RuntimeError):
    def __init__(self, message, status_code=502):
        super().__init__(message)
        self.status_code = status_code


def _key():
    value = (os.getenv("GEMINI_API_KEY") or "").strip()
    if not value or value.startswith("sk-") or "COPY_" in value:
        raise TextAIError("Set the Google AI Studio GEMINI_API_KEY in FastAPI/.env.", 503)
    model = os.getenv("GEMINI_MODEL", MODEL).strip()
    if MODEL not in SUPPORTED_MODELS or model != MODEL:
        raise TextAIError("Select gemini-3.5-flash-lite or gemini-3.8-flash only; no model fallback is enabled.", 503)
    return value


def _request(method, path, **kwargs):
    key = _key()
    # Fixed Google endpoint; keep credentials out of query strings and error text.
    headers = {"Authorization": f"Bearer {key}"} if path.startswith("/openai/") else {"x-goog-api-key": key}
    try:
        response = requests.request(
            method, BASE_URL + path, headers=headers,
            allow_redirects=False, timeout=(10, 120), **kwargs
        )
    except requests.RequestException as exc:
        # Exception type is safe; raw exception messages may contain credentials.
        kind = type(exc).__name__
        raise TextAIError(
            f"Gemini network error: {kind} (connect limit 10s / read limit 120s). "
            "No automatic retry was made.", 504
        ) from None
    with response:
        if not 200 <= response.status_code < 300:
            status = response.status_code
            hint = {
                400: "Check the request and API key configuration.",
                401: "Check GEMINI_API_KEY.",
                403: "Check AI Studio project verification and Gemini API access. Keep the project on Free Tier.",
                404: f"{MODEL} is unavailable for this project; no alternative model was called.",
                429: "Free quota or rate limit reached. Wait for reset; no paid fallback or retry was made.",
            }.get(status, "Gemini is unavailable. Try again later.")
            raise TextAIError(f"Gemini HTTP {status}. {hint}", 429 if status == 429 else 502)
        try:
            data = response.json()
        except ValueError:
            raise TextAIError("Gemini returned invalid JSON.") from None
    if not isinstance(data, dict):
        raise TextAIError("Gemini returned an unexpected response.")
    return data


def check_model():
    """Read model metadata only; does not generate text or verify billing tier."""
    data = _request("GET", "/models/" + MODEL)
    if data.get("name") != "models/" + MODEL or "generateContent" not in data.get("supportedGenerationMethods", []):
        raise TextAIError("The configured Gemini model cannot generate text.")


def chat_completion(*, messages, max_tokens=500, temperature=0.4):
    if not isinstance(messages, list) or not messages:
        raise TextAIError("Text generation requires messages.", 400)
    data = _request("POST", "/openai/chat/completions", json={
        "model": MODEL,
        "messages": messages,
        "temperature": temperature,
        "reasoning_effort": "low",
        # Thinking also consumes the output budget. Reserve room for the final text.
        "max_tokens": max(2048, max_tokens + 1024),
        "stream": False,
    })
    try:
        choice = data["choices"][0]
        content = choice["message"]["content"]
    except (KeyError, IndexError, TypeError):
        raise TextAIError("Gemini returned no text choice; check content filtering or model availability.") from None
    if choice.get("finish_reason") not in ("stop", None):
        raise TextAIError("Gemini output was incomplete or filtered; no partial result was returned.")
    if not isinstance(content, str) or not content.strip():
        raise TextAIError("Gemini returned empty text.")
    return data
