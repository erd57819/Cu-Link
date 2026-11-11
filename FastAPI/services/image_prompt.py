"""Validate the scene before spending any image-generation quota."""
import re


def validate_image_prompt(value):
    if not isinstance(value, str):
        raise ValueError("Image description must be text")
    prompt = value.strip()
    if (not 1 <= len(prompt) <= 600 or not re.search(r"[A-Za-z]", prompt)
            or re.search(r"[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]", prompt)):
        raise ValueError("Image description must be a short English scene")
    lowered = prompt.lower()
    if any(marker in lowered for marker in (
        "mymemory", "used all available free translations", "query length limit exceeded",
        "max allowed query", "invalid source language", "<html", "<!doctype",
    )):
        raise ValueError("A provider warning cannot be used as an image description")
    return prompt
