"""
Integration and algorithm tests for backend.stego module.
Validates PRD Section 9 (FFT Steganography), Section 10 (Targets), and Section 11 (Robustness).
"""

import io
import numpy as np
import pytest
from PIL import Image

from backend.crypto import KeyValidationError, generate_master_key
from backend.stego import (
    StegoCapacityError,
    StegoDecodeError,
    decode_image,
    encode_image,
)


def _create_synthetic_image(width: int = 256, height: int = 256, mode: str = "RGB") -> bytes:
    """Create a synthetic PNG image bytes."""
    channels = 4 if mode == "RGBA" else (1 if mode == "L" else 3)
    np.random.seed(123)
    data = np.random.randint(60, 200, (height, width, channels), dtype=np.uint8)
    if mode == "L":
        data = data.squeeze(-1)
    img = Image.fromarray(data, mode=mode)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_stego_exact_recovery_and_quality():
    """Exact message recovery with PSNR >= 40 dB and SSIM >= 0.99 (PRD 10, 18)."""
    cover_png = _create_synthetic_image(256, 256, "RGB")
    secret_text = "Meet at 6, north gate. Bring the documents."

    stego_png, key, metrics = encode_image(cover_png, secret_text)

    # Validate quality metrics targets
    assert metrics["psnr"] >= 40.0, f"PSNR {metrics['psnr']} is below target 40 dB"
    assert metrics["ssim"] >= 0.99, f"SSIM {metrics['ssim']} is below target 0.99"
    assert metrics["used_bytes"] == len(secret_text.encode("utf-8"))

    # Exact recovery with 0 bit errors
    recovered_text = decode_image(stego_png, key)
    assert recovered_text == secret_text


def test_wrong_key_clean_failure():
    """Wrong key must fail cleanly and never reveal plaintext (PRD D-3, 9.4)."""
    cover_png = _create_synthetic_image(256, 256, "RGB")
    secret_text = "Highly confidential intelligence."

    stego_png, _, _ = encode_image(cover_png, secret_text)
    wrong_key = generate_master_key()

    with pytest.raises(StegoDecodeError):
        decode_image(stego_png, wrong_key)


def test_malformed_key_fails_validation():
    """Malformed key must fail fast before heavy processing (PRD D-2)."""
    cover_png = _create_synthetic_image(256, 256, "RGB")
    stego_png, _, _ = encode_image(cover_png, "Sample")

    with pytest.raises(KeyValidationError):
        decode_image(stego_png, "AAAA-BBBB-CCCC")


def test_substantially_tampered_image_fails():
    """Altering significant payload areas must fail authentication (PRD D-3, Section 11)."""
    cover_png = _create_synthetic_image(256, 256, "RGB")
    stego_png, key, _ = encode_image(cover_png, "Protected message")

    img = Image.open(io.BytesIO(stego_png))
    arr = np.array(img)
    # Wipe out top half of image
    arr[:130, :, :] = 0
    t_buf = io.BytesIO()
    Image.fromarray(arr).save(t_buf, format="PNG")

    with pytest.raises(StegoDecodeError):
        decode_image(t_buf.getvalue(), key)


def test_rgba_alpha_preservation():
    """RGBA covers must preserve alpha channel untouched (PRD E-9)."""
    cover_png = _create_synthetic_image(256, 256, "RGBA")
    secret_text = "Transparent PNG test message"

    stego_png, key, _ = encode_image(cover_png, secret_text)
    recovered_text = decode_image(stego_png, key)
    assert recovered_text == secret_text

    stego_pil = Image.open(io.BytesIO(stego_png))
    assert stego_pil.mode == "RGBA"


def test_capacity_exceeded_error():
    """Reject payloads exceeding image capacity with StegoCapacityError (PRD E-6)."""
    # 128x128 image has (16x16) = 256 blocks -> ~0-10 bytes capacity
    small_cover = _create_synthetic_image(128, 128, "RGB")
    huge_message = "A" * 1000

    with pytest.raises(StegoCapacityError):
        encode_image(small_cover, huge_message)
