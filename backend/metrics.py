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


from PIL import Image

def calculate_psnr(original: np.ndarray, stego: np.ndarray) -> float:
    """
    Compute Peak Signal-to-Noise Ratio (PSNR) in decibels (dB) between cover and stego.
    PSNR = 10 * log10(MAX^2 / MSE).
    Target: >= 40 dB per PRD Section 10.
    Uses float32 to conserve memory.
    """
    if original.shape != stego.shape:
        raise ValueError("Image shapes must match to compute PSNR.")

    orig_f = original.astype(np.float32)
    stego_f = stego.astype(np.float32)

    mse = float(np.mean((orig_f - stego_f) ** 2))
    if mse == 0:
        return 99.0  # Visually identical / infinite PSNR capped for UI display

    psnr = 10.0 * math.log10((255.0 ** 2) / mse)
    return round(float(psnr), 2)


def calculate_ssim(original: np.ndarray, stego: np.ndarray) -> float:
    """
    Compute Structural Similarity Index (SSIM) between cover and stego.
    Target: >= 0.99 per PRD Section 10.
    For high-resolution images (>1024px), downsamples for comparison to prevent
    kernel convolution OOM spikes on 512MB memory limit environments (Render Free Tier).
    """
    if original.shape != stego.shape:
        raise ValueError("Image shapes must match to compute SSIM.")

    h, w = original.shape[:2]
    max_dim = max(h, w)

    # Scale down large images for SSIM to strictly bound memory under 30MB
    if max_dim > 1024:
        scale = 1024.0 / max_dim
        new_w, new_h = max(8, int(w * scale)), max(8, int(h * scale))
        orig_pil = Image.fromarray(original).resize((new_w, new_h), Image.Resampling.BILINEAR)
        stego_pil = Image.fromarray(stego).resize((new_w, new_h), Image.Resampling.BILINEAR)
        comp_orig = np.array(orig_pil)
        comp_stego = np.array(stego_pil)
    else:
        comp_orig = original
        comp_stego = stego

    if _HAVE_SKIMAGE:
        # Determine channel axis if multi-channel (RGB/RGBA)
        if comp_orig.ndim == 3:
            return round(float(_sk_ssim(comp_orig, comp_stego, channel_axis=-1, data_range=255)), 4)
        return round(float(_sk_ssim(comp_orig, comp_stego, data_range=255)), 4)

    # Standard SSIM formula implementation (Wang et al., 2004) with float32
    c1 = (0.01 * 255.0) ** 2
    c2 = (0.03 * 255.0) ** 2

    if comp_orig.ndim == 3:
        orig_f = (0.299 * comp_orig[..., 0] + 0.587 * comp_orig[..., 1] + 0.114 * comp_orig[..., 2]).astype(np.float32)
        stego_f = (0.299 * comp_stego[..., 0] + 0.587 * comp_stego[..., 1] + 0.114 * comp_stego[..., 2]).astype(np.float32)
    else:
        orig_f = comp_orig.astype(np.float32)
        stego_f = comp_stego.astype(np.float32)

    mu_x = float(np.mean(orig_f))
    mu_y = float(np.mean(stego_f))

    diff_x = orig_f - mu_x
    diff_y = stego_f - mu_y

    var_x = float(np.mean(diff_x ** 2))
    var_y = float(np.mean(diff_y ** 2))
    cov_xy = float(np.mean(diff_x * diff_y))

    numerator = (2.0 * mu_x * mu_y + c1) * (2.0 * cov_xy + c2)
    denominator = (mu_x ** 2 + mu_y ** 2 + c1) * (var_x + var_y + c2)

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
