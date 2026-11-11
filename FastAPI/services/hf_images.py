"""Call the existing public FLUX ZeroGPU Space; never use paid Providers."""
import io
import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urljoin, urlsplit

import requests
from dotenv import load_dotenv
from PIL import Image, UnidentifiedImageError

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

SPACE_ID = "black-forest-labs/FLUX.1-schnell"
SPACE_URL = "https://black-forest-labs-flux-1-schnell.hf.space"
MAX_BYTES = 10 * 1024 * 1024
PARAMETERS = ["prompt", "seed", "randomize_seed", "width", "height", "num_inference_steps"]


class HfImageError(RuntimeError):
    """Messages deliberately exclude provider bodies, prompts, and tokens."""


class ZeroGpuImages:
    def __init__(self):
        self.token = (os.getenv("HUGGINGFACE_TOKEN") or "").strip()
        if not self.token.startswith("hf_") or len(self.token) < 10:
            raise HfImageError("Set HUGGINGFACE_TOKEN in FastAPI/.env.")
        try:
            self.size = int(os.getenv("HF_IMAGE_SIZE", "512"))
        except ValueError:
            raise HfImageError("HF_IMAGE_SIZE must be 512, 768, or 1024.") from None
        if self.size not in (512, 768, 1024):
            raise HfImageError("HF_IMAGE_SIZE must be 512, 768, or 1024.")
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def _request(self, method, url, *, authenticated=True, **kwargs):
        # Only these two fixed hosts ever receive the token. Redirects are denied.
        parsed = urlsplit(url)
        if parsed.scheme != "https" or parsed.netloc not in (
            "huggingface.co", urlsplit(SPACE_URL).netloc
        ):
            raise HfImageError("Unexpected Hugging Face URL.")
        try:
            response = requests.request(
                method, url, headers=self.headers if authenticated else {},
                timeout=(10, 30), allow_redirects=False, **kwargs
            )
        except requests.RequestException:
            raise HfImageError("Hugging Face network request failed or timed out.") from None
        if not 200 <= response.status_code < 300:
            status = response.status_code
            response.close()
            hint = {
                401: "Check the token and email verification.",
                403: "Check account/token access to the public Space.",
                402: "Payment required: stopped; no paid fallback is configured.",
                429: "Quota or rate limit reached: wait for quota reset.",
                503: "The shared Space is unavailable or starting; try later.",
            }.get(status, "Check the Space status in your browser.")
            raise HfImageError(f"Hugging Face HTTP {status}. {hint}")
        return response

    def check_connection(self):
        with self._request("GET", "https://huggingface.co/api/whoami-v2") as response:
            account = response.json()
        if not isinstance(account, dict) or not account.get("name"):
            raise HfImageError("Unexpected token verification response.")
        with self._request("GET", SPACE_URL + "/gradio_api/info") as response:
            info = response.json()
        endpoint = info.get("named_endpoints", {}).get("/infer", {})
        names = [p.get("parameter_name") for p in endpoint.get("parameters", [])]
        if names != PARAMETERS:
            raise HfImageError("The public Space API changed; update the adapter before generating.")

    def generate(self, prompt):
        if not isinstance(prompt, str) or not prompt.strip() or len(prompt) > 4000:
            raise HfImageError("Image prompt must contain 1-4000 characters.")
        # A single submission only: retries could consume the daily GPU quota twice.
        with self._request("POST", SPACE_URL + "/gradio_api/call/infer", json={
            "data": [prompt, 0, True, self.size, self.size, 4]
        }) as response:
            event_id = response.json().get("event_id", "")
        if not isinstance(event_id, str) or not re.fullmatch(r"[a-zA-Z0-9_-]{1,128}", event_id):
            raise HfImageError("Unexpected Space job identifier.")
        file_data = self._wait_for_image(event_id)
        return self._download_png(file_data)

    def _wait_for_image(self, event_id):
        started = time.monotonic()
        url = SPACE_URL + "/gradio_api/call/infer/" + event_id
        try:
            with self._request("GET", url, stream=True) as response:
                response.encoding = "utf-8"
                event, data = "", []
                for line in response.iter_lines(decode_unicode=True):
                    if time.monotonic() - started > 120:
                        raise HfImageError("Space queue wait exceeded 120s; the submitted job may still run.")
                    if line.startswith("event:"):
                        event = line[6:].strip()
                    elif line.startswith("data:"):
                        data.append(line[5:].lstrip())
                        if sum(map(len, data)) > 65536:
                            raise HfImageError("Unexpectedly large Space event.")
                    elif not line:
                        if event == "error":
                            raise HfImageError("Space generation failed. Check its browser UI for quota or service status.")
                        if event == "complete":
                            result = json.loads("\n".join(data))
                            if isinstance(result, list) and result and isinstance(result[0], dict):
                                return result[0]
                            raise HfImageError("Unexpected image result from Space.")
                        event, data = "", []
        except requests.RequestException:
            raise HfImageError("Space result stream timed out or disconnected; the submitted job may still run.") from None
        except (ValueError, TypeError):
            raise HfImageError("Invalid Space event response.") from None
        raise HfImageError("Space closed the stream without an image.")

    def _download_png(self, file_data):
        file_url = file_data.get("url")
        if not isinstance(file_url, str):
            raise HfImageError("Space did not return an image URL.")
        url = urljoin(SPACE_URL + "/", file_url)
        parsed = urlsplit(url)
        if (parsed.scheme != "https" or parsed.netloc != urlsplit(SPACE_URL).netloc
                or parsed.fragment or not parsed.path.startswith(("/gradio_api/file=", "/file="))):
            raise HfImageError("Unexpected image download URL.")
        chunks, size = [], 0
        try:
            # Result files are public; do not attach a token to the download.
            with self._request("GET", url, authenticated=False, stream=True) as response:
                for chunk in response.iter_content(chunk_size=65536):
                    size += len(chunk)
                    if size > MAX_BYTES:
                        raise HfImageError("Generated image exceeds 10 MiB.")
                    chunks.append(chunk)
        except requests.RequestException:
            raise HfImageError("Image download failed.") from None
        try:
            with Image.open(io.BytesIO(b"".join(chunks))) as image:
                if image.format not in ("PNG", "JPEG", "WEBP") or image.width * image.height > 2048 * 2048:
                    raise HfImageError("Unexpected image format or dimensions.")
                output = io.BytesIO()
                image.convert("RGB").save(output, format="PNG")
                png = output.getvalue()
                if len(png) > MAX_BYTES:
                    raise HfImageError("Converted image exceeds 10 MiB.")
                return png
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
            raise HfImageError("Space response is not a valid supported image.") from None
