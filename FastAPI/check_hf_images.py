"""Default: verify credentials/API only. --generate consumes daily ZeroGPU quota."""
import argparse
import tempfile
import uuid
from pathlib import Path

from services.hf_images import HfImageError, ZeroGpuImages


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--generate", action="store_true", help="Generate one image using daily ZeroGPU quota")
    args = parser.parse_args()
    try:
        images = ZeroGpuImages()
        images.check_connection()
        print("[OK] Hugging Face: token accepted / public FLUX Space API available")
        if not args.generate:
            print("Read-only check complete. No image was generated; no GPU job was submitted.")
            return 0
        png = images.generate("A small blue cube on a white desk, clean illustration")
        path = Path(tempfile.gettempdir()) / f"culink-hf-check-{uuid.uuid4().hex}.png"
        path.write_bytes(png)
        print("[OK] ZeroGPU: one image generated / downloaded / validated as PNG")
        print("Saved:", path)
        print("No database rows or Storage objects were changed.")
        return 0
    except HfImageError as error:
        print("[FAIL]", error)
    except Exception as error:
        print("[FAIL] Unexpected error:", type(error).__name__)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
