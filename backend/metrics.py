"""
Quality and Capacity Metrics module for Veil Steganography Platform.
Calculates PSNR, SSIM, BPP, and image payload capacity (PRD Section 10, 14.1).
"""

import math
from typing import Tuple
import numpy as np

try:
    from skimage.metrics import structural_similarity as _sk_ssim
    _HAVE_SKIMAGE = True
except ImportError:
    _sk_ssim = None  # type: ignore
    _HAVE_SKIMAGE = False


def calculate_psnr(original: np.ndarray, stego: np.ndarray) -> float:
    """
    Compute Peak Signal-to-Noise Ratio (PSNR) in decibels (dB) between cover and stego.
    PSNR = 10 * log10(MAX^2 / MSE).
    Target: >= 40 dB per PRD Section 10.
    """
    if original.shape != stego.shape:
        raise ValueError("Image shapes must match to compute PSNR.")

    orig_f = original.astype(np.float64)
    stego_f = stego.astype(np.float64)

    mse = np.mean((orig_f - stego_f) ** 2)
    if mse == 0:
        return 99.0  # Visually identical / infinite PSNR capped for UI display

    psnr = 10.0 * math.log10((255.0 ** 2) / mse)
    return round(float(psnr), 2)


def calculate_ssim(original: np.ndarray, stego: np.ndarray) -> float:
    """
    Compute Structural Similarity Index (SSIM) between cover and stego.
    Target: >= 0.99 per PRD Section 10.
    Uses scikit-image when available with pure NumPy standard formulation fallback.
    """
    if original.shape != stego.shape:
        raise ValueError("Image shapes must match to compute SSIM.")

    if _HAVE_SKIMAGE:
        # Determine channel axis if multi-channel (RGB/RGBA)
        if original.ndim == 3:
            return round(float(_sk_ssim(original, stego, channel_axis=-1, data_range=255)), 4)
        return round(float(_sk_ssim(original, stego, data_range=255)), 4)

    # Standard SSIM formula implementation (Wang et al., 2004)
    c1 = (0.01 * 255.0) ** 2
    c2 = (0.03 * 255.0) ** 2

    orig_f = original.astype(np.float64)
    stego_f = stego.astype(np.float64)

    mu_x = np.mean(orig_f)
    mu_y = np.mean(stego_f)

    sigma_x_sq = np.var(orig_f)
    sigma_y_sq = np.var(stego_f)
    sigma_xy = np.mean((orig_f - mu_x) * (stego_f - mu_y))

    numerator = (2.0 * mu_x * mu_y + c1) * (2.0 * sigma_xy + c2)
    denominator = (mu_x ** 2 + mu_y ** 2 + c1) * (sigma_x_sq + sigma_y_sq + c2)

    ssim_val = numerator / denominator
    return round(float(ssim_val), 4)


def calculate_capacity(width: int, height: int) -> int:
    """
    Calculate maximum secret message capacity in bytes for given image dimensions (PRD 9.6).
    With 8x8 blocks and 1 bit per block, 512x512 yields ~400 bytes usable message.
    Bounded by hard cap of 4096 bytes for v1 (PRD 14.4).
    """
    blocks = (width // 8) * (height // 8)
    raw_bits = blocks
    raw_bytes = raw_bits // 8

    # Overhead:
    # AAD Header (15 bytes) + AES-GCM Tag (16 bytes) + ECC Parity (16 bytes) + framing (4 bytes) = 51 bytes
    overhead_bytes = 51
    usable_bytes = int(math.floor(raw_bytes * 0.90) - overhead_bytes)

    # Clamp between 0 and 4096 bytes
    return max(0, min(4096, usable_bytes))


def calculate_bpp(payload_bytes: int, width: int, height: int) -> float:
    """
    Compute payload density in bits-per-pixel (bpp).
    bpp = (payload_bytes * 8) / (width * height).
    """
    if width <= 0 or height <= 0:
        return 0.0
    total_pixels = width * height
    bpp = (payload_bytes * 8.0) / total_pixels
    return round(float(bpp), 4)
