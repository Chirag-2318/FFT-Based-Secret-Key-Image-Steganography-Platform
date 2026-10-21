"""
API Contract and Integration tests for Veil FastAPI endpoints.
Validates PRD Section 14.3 and frontend/client.ts contract expectations.
"""

import io
import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from backend.api import app
from backend.crypto import generate_master_key

client = TestClient(app)


def _get_test_png(width: int = 256, height: int = 256) -> bytes:
    np.random.seed(42)
    arr = np.random.randint(60, 200, (height, width, 3), dtype=np.uint8)
    img = Image.fromarray(arr, mode="RGB")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_health_endpoint():
    """Health check returns status ok."""
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_capacity_endpoint():
    """POST /api/v1/capacity returns accurate capacity in bytes."""
    png_bytes = _get_test_png(512, 512)
    files = {"image": ("test.png", png_bytes, "image/png")}

    resp = client.post("/api/v1/capacity", files=files)
    assert resp.status_code == 200
    data = resp.json()
    assert "capacity_bytes" in data
    # 512x512 should have roughly 400 bytes capacity
    assert 350 <= data["capacity_bytes"] <= 450


def test_encode_and_decode_api_roundtrip():
    """
    POST /api/v1/encode and POST /api/v1/decode end-to-end round trip.
    Validates JSON strategy with image_base64, key, and metrics.
    """
    cover_png = _get_test_png(256, 256)
    secret_msg = "Top secret message transmitted through Veil."

    # Encode request
    encode_resp = client.post(
        "/api/v1/encode",
        files={"image": ("cover.png", cover_png, "image/png")},
        data={"message": secret_msg},
    )
    assert encode_resp.status_code == 200, encode_resp.text
    encode_data = encode_resp.json()

    assert "image_base64" in encode_data
    assert "key" in encode_data
    assert "metrics" in encode_data
    assert encode_data["metrics"]["psnr"] >= 40.0
    assert encode_data["metrics"]["ssim"] >= 0.99

    import base64
    stego_png_bytes = base64.b64decode(encode_data["image_base64"])
    stego_key = encode_data["key"]

    # Decode request
    decode_resp = client.post(
        "/api/v1/decode",
        files={"image": ("stego.png", stego_png_bytes, "image/png")},
        data={"key": stego_key},
    )
    assert decode_resp.status_code == 200, decode_resp.text
    decode_data = decode_resp.json()
    assert decode_data["message"] == secret_msg


def test_decode_malformed_key_returns_400():
    """Malformed key returns 400 Bad Request with malformed_key detail (PRD D-2)."""
    cover_png = _get_test_png(256, 256)
    resp = client.post(
        "/api/v1/decode",
        files={"image": ("test.png", cover_png, "image/png")},
        data={"key": "NOT-A-VALID-KEY"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "malformed_key"


def test_decode_wrong_key_returns_422_generic():
    """Wrong key returns 422 Unprocessable Entity with generic decode_failed (PRD D-3)."""
    cover_png = _get_test_png(256, 256)
    # Generate a syntactically valid but wrong key
    wrong_key = generate_master_key()

    resp = client.post(
        "/api/v1/decode",
        files={"image": ("test.png", cover_png, "image/png")},
        data={"key": wrong_key},
    )
    assert resp.status_code == 422
    assert resp.json()["detail"] == "decode_failed"


def test_invalid_image_format_returns_400():
    """Non-image binary returns 400 Bad Request (PRD E-1)."""
    invalid_bytes = b"This is a text file, not an image."
    resp = client.post(
        "/api/v1/encode",
        files={"image": ("fake.png", invalid_bytes, "image/png")},
        data={"message": "Test"},
    )
    assert resp.status_code == 400
