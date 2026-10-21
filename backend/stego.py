"""
FFT-Based Steganography Engine for Veil Platform.
Compliant with PRD Section 9 (Steganography specification).
Implements block 2D-FFT, conjugate symmetry preservation, keyed coefficient selection,
differential Quantization Index Modulation (QIM), and self-check verification.
"""

import io
import math
import random
import struct
from typing import List, Optional, Tuple

import numpy as np
from PIL import Image

from backend.config import (
    BLOCK_SIZE,
    CANDIDATE_PAIRS,
    QIM_DELTA,
)
from backend.crypto import (
    DecryptionError,
    decrypt_payload,
    derive_subkeys,
    encrypt_payload,
    generate_master_key,
    parse_and_verify_key,
)
from backend.ecc import ECCDecodeError, decode_ecc, encode_ecc
from backend.metrics import calculate_bpp, calculate_capacity, calculate_psnr, calculate_ssim


class StegoCapacityError(Exception):
    """Raised when the message payload exceeds image embedding capacity."""
    def __init__(self, message: str, max_capacity_bytes: int):
        super().__init__(message)
        self.max_capacity_bytes = max_capacity_bytes


class StegoDecodeError(Exception):
    """Generic decode failure for wrong key, corrupted/tampered image (PRD 9.4, D-3)."""
    pass


def _rgb_to_ycbcr(rgb: np.ndarray) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Convert RGB image (float64, 0..255) to YCbCr ITU-R BT.601 channels.
    Embeddings only occur in Y (luminance) channel (PRD 9.2).
    """
    r = rgb[..., 0]
    g = rgb[..., 1]
    b = rgb[..., 2]

    y = 0.299 * r + 0.587 * g + 0.114 * b
    cb = -0.168736 * r - 0.331264 * g + 0.5 * b + 128.0
    cr = 0.5 * r - 0.418688 * g - 0.081312 * b + 128.0

    return y, cb, cr


def _ycbcr_to_rgb(y: np.ndarray, cb: np.ndarray, cr: np.ndarray) -> np.ndarray:
    """Convert YCbCr channels back to RGB (float64, 0..255)."""
    cb_shift = cb - 128.0
    cr_shift = cr - 128.0

    r = y + 1.402 * cr_shift
    g = y - 0.344136 * cb_shift - 0.714136 * cr_shift
    b = y + 1.772 * cb_shift

    rgb = np.stack([r, g, b], axis=-1)
    return np.clip(rgb, 0.0, 255.0)


def _bytes_to_bits(data: bytes) -> List[int]:
    """Convert bytes to a list of integer bits (MSB first)."""
    bits = []
    for byte in data:
        for shift in range(7, -1, -1):
            bits.append((byte >> shift) & 1)
    return bits


def _bits_to_bytes(bits: List[int]) -> bytes:
    """Convert a list of integer bits (multiple of 8) back to bytes."""
    byte_vals = bytearray()
    for i in range(0, len(bits), 8):
        byte = 0
        for b_idx in range(8):
            if i + b_idx < len(bits):
                byte = (byte << 1) | (bits[i + b_idx] & 1)
        byte_vals.append(byte)
    return bytes(byte_vals)


def _get_keyed_bit_locations(
    k_pos: bytes,
    total_blocks: int,
    num_bits: int,
) -> List[Tuple[int, Tuple[Tuple[int, int], Tuple[int, int]]]]:
    """
    Generate deterministic (block_index, candidate_pair) sequence seeded by K_pos (PRD 9.2).
    Generates a full permutation of total_blocks so that the first N blocks/pairs
    are strictly identical regardless of num_bits requested.
    """
    rng = random.Random(k_pos)
    perm = list(range(total_blocks))
    rng.shuffle(perm)
    pairs = [
        CANDIDATE_PAIRS[rng.randint(0, len(CANDIDATE_PAIRS) - 1)]
        for _ in range(total_blocks)
    ]
    return [(perm[i], pairs[i]) for i in range(num_bits)]


def _embed_bit_in_block(
    block: np.ndarray,
    bit: int,
    pair: Tuple[Tuple[int, int], Tuple[int, int]],
    delta: float = QIM_DELTA,
) -> np.ndarray:
    """
    Embed a single bit into an 8x8 block using 2D FFT and differential QIM.
    Strictly preserves conjugate symmetry to guarantee real-valued reconstruction (PRD 9.2).
    """
    f = np.fft.fft2(block)

    (u1, v1), (u2, v2) = pair
    # Conjugate symmetric partner indices in 8x8 DFT
    conj_u1, conj_v1 = (8 - u1) % 8, (8 - v1) % 8
    conj_u2, conj_v2 = (8 - u2) % 8, (8 - v2) % 8

    c1 = f[u1, v1]
    c2 = f[u2, v2]

    m1 = float(abs(c1))
    m2 = float(abs(c2))

    d = m1 - m2
    k = int(round(d / delta))
    if (k % 2) != bit:
        if d >= k * delta:
            k += 1
        else:
            k -= 1

    target_d = k * delta
    diff = target_d - d
    half_diff = diff / 2.0

    # Apply minimal symmetric magnitude shift
    m1_prime = max(0.1, m1 + half_diff)
    m2_prime = max(0.1, m2 - half_diff)

    # Scale complex coefficients keeping original phase
    phase1 = c1 / m1 if m1 > 1e-9 else 1.0 + 0.0j
    phase2 = c2 / m2 if m2 > 1e-9 else 1.0 + 0.0j

    new_c1 = m1_prime * phase1
    new_c2 = m2_prime * phase2

    f[u1, v1] = new_c1
    f[conj_u1, conj_v1] = np.conj(new_c1)

    f[u2, v2] = new_c2
    f[conj_u2, conj_v2] = np.conj(new_c2)

    # Reconstruct real spatial block via inverse FFT
    recon_block = np.fft.ifft2(f).real
    return recon_block


def _extract_bit_from_block(
    block: np.ndarray,
    pair: Tuple[Tuple[int, int], Tuple[int, int]],
    delta: float = QIM_DELTA,
) -> int:
    """
    Extract a single bit from an 8x8 block using 2D FFT and differential QIM quantization class.
    """
    f = np.fft.fft2(block)
    (u1, v1), (u2, v2) = pair

    m1 = float(abs(f[u1, v1]))
    m2 = float(abs(f[u2, v2]))

    d = m1 - m2
    k = int(round(d / delta))
    return int(abs(k) % 2)


def encode_image(
    cover_image_bytes: bytes,
    secret_message: str,
) -> Tuple[bytes, str, dict]:
    """
    Execute full end-to-end Stego Encode flow (PRD Section 5.1, Section 6.1):
    1. Validate image format, dimensions, and message capacity.
    2. Generate CSPRNG master key and derive subkeys (HKDF).
    3. Encrypt secret message with AES-256-GCM.
    4. Apply Reed-Solomon ECC.
    5. Embed framed bitstream into luminance channel via block 2D-FFT differential QIM.
    6. Reconstruct PNG and run self-check (E-8) confirming exact recovery.
    7. Return stego PNG bytes, formatted key, and quality metrics.
    """
    # Load cover image
    try:
        pil_img = Image.open(io.BytesIO(cover_image_bytes))
        width, height = pil_img.size
    except Exception as exc:
        raise ValueError("Invalid cover image file.") from exc

    # Alpha channel preservation (PRD E-9)
    alpha_channel: Optional[np.ndarray] = None
    if pil_img.mode == "RGBA":
        img_np = np.array(pil_img)
        alpha_channel = img_np[..., 3]
        rgb_img = pil_img.convert("RGB")
    elif pil_img.mode == "L":
        rgb_img = pil_img.convert("RGB")
    elif pil_img.mode == "RGB":
        rgb_img = pil_img
    else:
        rgb_img = pil_img.convert("RGB")

    cover_rgb = np.array(rgb_img, dtype=np.float32)

    # Compute capacity
    max_capacity = calculate_capacity(width, height)
    message_bytes = secret_message.encode("utf-8")
    if len(message_bytes) > max_capacity:
        raise StegoCapacityError(
            f"Message of {len(message_bytes)} bytes exceeds image capacity of {max_capacity} bytes.",
            max_capacity_bytes=max_capacity,
        )

    # Generate master key and subkeys
    key_str = generate_master_key()
    master_key = parse_and_verify_key(key_str)
    k_enc, k_pos, _ = derive_subkeys(master_key)

    # Encrypt payload with AES-256-GCM
    encrypted_payload = encrypt_payload(k_enc, message_bytes)

    # Apply Reed-Solomon ECC
    ecc_payload = encode_ecc(encrypted_payload)

    # Framing: 4-byte big-endian length prefix for ECC payload
    length_prefix = struct.pack(">I", len(ecc_payload))
    stream_to_embed = length_prefix + ecc_payload
    bits_to_embed = _bytes_to_bits(stream_to_embed)

    total_blocks_h = height // BLOCK_SIZE
    total_blocks_w = width // BLOCK_SIZE
    total_blocks = total_blocks_h * total_blocks_w

    if len(bits_to_embed) > total_blocks:
        raise StegoCapacityError(
            f"Framed bitstream ({len(bits_to_embed)} bits) exceeds total blocks ({total_blocks}).",
            max_capacity_bytes=max_capacity,
        )

    # Keyed embedding locations
    locations = _get_keyed_bit_locations(k_pos, total_blocks, len(bits_to_embed))

    # Convert to YCbCr using float32 and immediately release cover_rgb
    cover_uint8 = np.array(rgb_img, dtype=np.uint8)
    cover_rgb = cover_uint8.astype(np.float32)
    stego_y, cb_channel, cr_channel = _rgb_to_ycbcr(cover_rgb)
    del cover_rgb

    # Embed bit by bit with iterative rounding compensation (PRD 9.2 step 9, Section 19)
    for bit_idx, (block_idx, pair) in enumerate(locations):
        bit = bits_to_embed[bit_idx]
        b_row = block_idx // total_blocks_w
        b_col = block_idx % total_blocks_w

        r_start = b_row * BLOCK_SIZE
        r_end = r_start + BLOCK_SIZE
        c_start = b_col * BLOCK_SIZE
        c_end = c_start + BLOCK_SIZE

        orig_block_y = stego_y[r_start:r_end, c_start:c_end]
        block_cb = cb_channel[r_start:r_end, c_start:c_end]
        block_cr = cr_channel[r_start:r_end, c_start:c_end]

        curr_block_y = orig_block_y
        for attempt in range(5):
            emb_block_y = _embed_bit_in_block(curr_block_y, bit, pair, delta=QIM_DELTA)
            rgb_emb = _ycbcr_to_rgb(emb_block_y, block_cb, block_cr)
            rgb_u8 = np.clip(np.round(rgb_emb), 0, 255).astype(np.uint8)
            y_rec, _, _ = _rgb_to_ycbcr(rgb_u8.astype(np.float32))
            ext = _extract_bit_from_block(y_rec, pair, delta=QIM_DELTA)
            if ext == bit:
                curr_block_y = emb_block_y
                break
            curr_block_y = curr_block_y + (emb_block_y - y_rec) * 1.2

        stego_y[r_start:r_end, c_start:c_end] = curr_block_y

    # Convert back to RGB and round to uint8, freeing float channel buffers
    stego_rgb_float = _ycbcr_to_rgb(stego_y, cb_channel, cr_channel)
    del stego_y, cb_channel, cr_channel
    stego_rgb_uint8 = np.clip(np.round(stego_rgb_float), 0, 255).astype(np.uint8)
    del stego_rgb_float

    # Reattach alpha channel if original was RGBA (PRD E-9)
    if alpha_channel is not None:
        stego_full_uint8 = np.dstack([stego_rgb_uint8, alpha_channel])
        stego_pil = Image.fromarray(stego_full_uint8, mode="RGBA")
    else:
        stego_pil = Image.fromarray(stego_rgb_uint8, mode="RGB")

    # Save lossless PNG to bytes
    out_buf = io.BytesIO()
    stego_pil.save(out_buf, format="PNG", optimize=False)
    stego_png_bytes = out_buf.getvalue()

    # Self-check (PRD E-8): decode stego PNG bytes and confirm exact message recovery
    try:
        recovered_message = decode_image(stego_png_bytes, key_str)
        if recovered_message != secret_message:
            raise StegoDecodeError("Self-check validation failed: recovered message does not match.")
    except Exception as exc:
        raise RuntimeError(f"Self-check failed to decode stego image: {exc}") from exc

    # Metrics calculation
    psnr = calculate_psnr(cover_uint8, stego_rgb_uint8)
    ssim = calculate_ssim(cover_uint8, stego_rgb_uint8)
    bpp = calculate_bpp(len(message_bytes), width, height)

    metrics = {
        "psnr": psnr,
        "ssim": ssim,
        "capacity_bytes": max_capacity,
        "used_bytes": len(message_bytes),
        "bpp": bpp,
    }

    return stego_png_bytes, key_str, metrics


def decode_image(
    stego_image_bytes: bytes,
    raw_key: str,
) -> str:
    """
    Execute full Stego Decode flow (PRD Section 5.2, Section 6.2):
    1. Validate key syntax and checksum (returns 400 malformed key on error).
    2. Extract block grid and keyed sequence from K_pos.
    3. Extract framed bits via differential QIM class decision.
    4. Decode Reed-Solomon ECC.
    5. Authenticate and decrypt AES-256-GCM ciphertext.
    6. Returns plaintext UTF-8 secret message or raises StegoDecodeError (PRD 9.4).
    """
    # Step 1: Validate key (raises KeyValidationError if invalid checksum or format)
    master_key = parse_and_verify_key(raw_key)
    k_enc, k_pos, _ = derive_subkeys(master_key)

    # Step 2: Load PNG without alteration
    try:
        pil_img = Image.open(io.BytesIO(stego_image_bytes))
        width, height = pil_img.size
        rgb_img = pil_img.convert("RGB")
        stego_rgb = np.array(rgb_img, dtype=np.float32)
    except Exception as exc:
        raise StegoDecodeError("Unable to read image bytes.") from exc

    total_blocks_h = height // BLOCK_SIZE
    total_blocks_w = width // BLOCK_SIZE
    total_blocks = total_blocks_h * total_blocks_w

    # Minimum bits needed for length header: 4 bytes = 32 bits
    if total_blocks < 32:
        raise StegoDecodeError("Image too small to contain secret message.")

    y_channel, _, _ = _rgb_to_ycbcr(stego_rgb)
    del stego_rgb

    # Step 3: Extract the 32-bit length prefix
    len_locations = _get_keyed_bit_locations(k_pos, total_blocks, 32)
    len_bits = []
    for blk_idx, pair in len_locations:
        b_row = blk_idx // total_blocks_w
        b_col = blk_idx % total_blocks_w
        r_start = b_row * BLOCK_SIZE
        r_end = r_start + BLOCK_SIZE
        c_start = b_col * BLOCK_SIZE
        c_end = c_start + BLOCK_SIZE

        block = y_channel[r_start:r_end, c_start:c_end]
        bit = _extract_bit_from_block(block, pair, delta=QIM_DELTA)
        len_bits.append(bit)

    len_bytes = _bits_to_bytes(len_bits)
    payload_len = struct.unpack(">I", len_bytes)[0]

    # Sanity checks on payload length
    total_bits_needed = 32 + (payload_len * 8)
    if payload_len <= 0 or total_bits_needed > total_blocks or payload_len > 100000:
        raise StegoDecodeError("Extraction failed: invalid payload framing.")

    # Step 4: Extract the full bitstream (length prefix + ECC payload)
    full_locations = _get_keyed_bit_locations(k_pos, total_blocks, total_bits_needed)
    extracted_bits = []
    for blk_idx, pair in full_locations[32:]:
        b_row = blk_idx // total_blocks_w
        b_col = blk_idx % total_blocks_w
        r_start = b_row * BLOCK_SIZE
        r_end = r_start + BLOCK_SIZE
        c_start = b_col * BLOCK_SIZE
        c_end = c_start + BLOCK_SIZE

        block = y_channel[r_start:r_end, c_start:c_end]
        bit = _extract_bit_from_block(block, pair, delta=QIM_DELTA)
        extracted_bits.append(bit)

    ecc_payload = _bits_to_bytes(extracted_bits)

    # Step 5: Reed-Solomon decode
    try:
        encrypted_payload = decode_ecc(ecc_payload)
    except (ECCDecodeError, Exception) as exc:
        raise StegoDecodeError("Error correction failed: corrupted payload.") from exc

    # Step 6: Authenticate and decrypt AES-GCM
    try:
        plaintext_bytes = decrypt_payload(k_enc, encrypted_payload)
        return plaintext_bytes.decode("utf-8")
    except (DecryptionError, UnicodeDecodeError, Exception) as exc:
        raise StegoDecodeError("Authentication or decryption failed.") from exc
