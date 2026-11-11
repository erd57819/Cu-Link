"""Read-only by default; --generate submits one short text generation request."""
import argparse

from services.text_ai import MODEL, TextAIError, chat_completion, check_model


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--generate", action="store_true", help="Use Free Tier quota for one short text request")
    args = parser.parse_args()
    try:
        check_model()
        print(f"[OK] Gemini: API key accepted / {MODEL} available")
        print("[INFO] Confirm Free Tier in AI Studio; API metadata does not expose the billing tier.")
        if not args.generate:
            print("Read-only check complete. No text was generated.")
            return 0
        result = chat_completion(messages=[{"role": "user", "content": "Reply with only OK."}], max_tokens=32)
        print("[OK] Gemini: one text generation request completed")
        print("Reply:", result["choices"][0]["message"]["content"].strip()[:100])
        print("No database rows, Storage objects, or HF GPU jobs were changed.")
        return 0
    except TextAIError as error:
        print("[FAIL]", error)
    except Exception as error:
        print("[FAIL] Unexpected error:", type(error).__name__)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
