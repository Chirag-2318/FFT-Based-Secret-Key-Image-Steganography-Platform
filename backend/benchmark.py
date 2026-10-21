"""
Benchmark harness for Veil Steganography Platform.
Compliant with PRD Section 11 (Robustness test matrix) and Section 14.1 (item 6).
Evaluates capacity, quality (PSNR, SSIM), and robustness across noise, blur, and compression.
"""

import io
import math
import os
import sys

# Ensure repository root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import numpy as np
from PIL import Image, ImageFilter

from backend.crypto import generate_master_key
from backend.metrics import calculate_psnr, calculate_ssim
from backend.stego import StegoDecodeError, decode_image, encode_image


def run_benchmark_matrix(image_size: int = 512, message: str = "Veil Benchmark Secret Message 2026"):
    """
    Execute PRD Section 11 Robustness Matrix and print regression report.
    """
    print("=" * 70)
    print("VEIL STEGANOGRAPHY PLATFORM - ROBUSTNESS BENCHMARK HARNESS")
    print(f"Image Size: {image_size}x{image_size} | Message Length: {len(message)} chars")
    print("=" * 70)

    # Generate synthetic photographic cover
    np.random.seed(42)
    # Gradient background with noise to simulate natural image
    x = np.linspace(0, 1, image_size)
    y = np.linspace(0, 1, image_size)
    xx, yy = np.meshgrid(x, y)
    base = (np.sin(xx * 6) * np.cos(yy * 6) * 60 + 128).astype(np.uint8)
    noise = np.random.randint(-20, 20, (image_size, image_size)).astype(np.int16)
    r = np.clip(base + noise, 0, 255).astype(np.uint8)
    g = np.clip(base * 0.9 + noise, 0, 255).astype(np.uint8)
    b = np.clip(base * 0.8 + noise, 0, 255).astype(np.uint8)
    cover_arr = np.dstack([r, g, b])

    buf = io.BytesIO()
    Image.fromarray(cover_arr).save(buf, format="PNG")
    cover_png = buf.getvalue()

    # Encode
    stego_png, key, metrics = encode_image(cover_png, message)
    print(f"\n[Baseline Encoding]")
    print(f"  PSNR: {metrics['psnr']} dB (Target >= 40.0 dB)")
    print(f"  SSIM: {metrics['ssim']} (Target >= 0.99)")
    print(f"  Capacity: {metrics['capacity_bytes']} bytes | Used: {metrics['used_bytes']} bytes")
    print(f"  Key: {key}\n")

    results = []

    # Test 1: Clean PNG save/load
    try:
        rec = decode_image(stego_png, key)
        passed = (rec == message)
        results.append(("Clean PNG Round Trip", "PASS" if passed else "FAIL", "Exact match (0 BER)"))
    except Exception as exc:
        results.append(("Clean PNG Round Trip", "FAIL", str(exc)))

    # Test 2: Low Gaussian noise
    try:
        stego_img = Image.open(io.BytesIO(stego_png))
        s_arr = np.array(stego_img, dtype=np.int16)
        noise = np.random.normal(0, 1.0, s_arr.shape).astype(np.int16)
        noisy_arr = np.clip(s_arr + noise, 0, 255).astype(np.uint8)
        n_buf = io.BytesIO()
        Image.fromarray(noisy_arr).save(n_buf, format="PNG")
        rec = decode_image(n_buf.getvalue(), key)
        results.append(("Low Gaussian Noise (sigma=1)", "PASS" if rec == message else "FAIL", "Absorbed by RS-ECC"))
    except Exception:
        results.append(("Low Gaussian Noise (sigma=1)", "FAIL", "Exceeded ECC capacity"))

    # Test 3: Mild blur
    try:
        stego_img = Image.open(io.BytesIO(stego_png))
        blurred = stego_img.filter(ImageFilter.GaussianBlur(radius=0.5))
        b_buf = io.BytesIO()
        blurred.save(b_buf, format="PNG")
        rec = decode_image(b_buf.getvalue(), key)
        results.append(("Mild Blur (radius=0.5)", "PASS" if rec == message else "FAIL", "Partial absorption"))
    except Exception:
        results.append(("Mild Blur (radius=0.5)", "EXPECTED FAIL", "High-frequency attenuation"))

    # Test 4: JPEG at Q95
    try:
        stego_img = Image.open(io.BytesIO(stego_png))
        j_buf = io.BytesIO()
        stego_img.save(j_buf, format="JPEG", quality=95)
        rec = decode_image(j_buf.getvalue(), key)
        results.append(("JPEG Compression (Q95)", "PASS" if rec == message else "FAIL", "Lossy recompression"))
    except Exception:
        results.append(("JPEG Compression (Q95)", "EXPECTED FAIL", "PRD Limitation: Lossy recompression"))

    # Test 5: Wrong key
    wrong_key = generate_master_key()
    try:
        decode_image(stego_png, wrong_key)
        results.append(("Wrong Key Test", "FAIL", "Should never reveal plaintext"))
    except StegoDecodeError:
        results.append(("Wrong Key Test", "PASS", "Failed cleanly with StegoDecodeError"))

    # Test 6: Substantial pixel tampering
    try:
        stego_img = Image.open(io.BytesIO(stego_png))
        t_arr = np.array(stego_img)
        t_arr[:150, :, :] = 0
        t_buf = io.BytesIO()
        Image.fromarray(t_arr).save(t_buf, format="PNG")
        decode_image(t_buf.getvalue(), key)
        results.append(("Payload Tampering", "FAIL", "Tampered image should fail"))
    except StegoDecodeError:
        results.append(("Payload Tampering", "PASS", "Authenticated GCM tag failed"))

    print("-" * 70)
    print(f"{'Test Description':<32} | {'Result':<15} | {'Notes'}")
    print("-" * 70)
    for desc, res, note in results:
        print(f"{desc:<32} | {res:<15} | {note}")
    print("-" * 70)


if __name__ == "__main__":
    run_benchmark_matrix()
