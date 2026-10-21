"""
Configuration and tunable parameters for Veil Steganography Platform.
Compliant with PRD Section 9.5 and Section 14.4.
"""

from dataclasses import dataclass
from typing import List, Tuple

# Protocol Version (1 byte)
PROTOCOL_VERSION: int = 1

# Block & Transform parameters
BLOCK_SIZE: int = 8  # 8x8 blocks

# Candidate frequency band within 8x8 block (u, v):
# Exclude DC (0,0), Nyquist points (0,4), (4,0), (4,4)
# Keep mid-frequency pairs. For conjugate symmetry, we select pairs from the
# independent half-plane u in [1, 3], v in [0, 7] or u=0, v in [1, 3].
# Pre-selected non-overlapping candidate pairs ((u1, v1), (u2, v2)) in mid-band:
CANDIDATE_PAIRS: List[Tuple[Tuple[int, int], Tuple[int, int]]] = [
    ((1, 2), (2, 1)),
    ((1, 3), (3, 1)),
    ((2, 2), (1, 4)),
    ((2, 3), (3, 2)),
    ((1, 5), (2, 4)),
    ((3, 3), (2, 5)),
]

# Quantization index modulation step size.
# Delta=35.0 balances high imperceptibility (PSNR >= 42 dB) with exact 8-bit rounding recovery.
QIM_DELTA: float = 35.0

# Reed-Solomon Error Correction Code parity symbols per block
RS_PARITY_SYMBOLS: int = 16  # Can correct up to 8 symbol (byte) errors

# Key design constants (PRD Section 7.2)
# Master key: 32 bytes (256 bits) + 3 bytes checksum = 35 bytes -> 56 Base32 chars
KEY_BYTES_LEN: int = 32
KEY_CHECKSUM_LEN: int = 3
KEY_TOTAL_BYTES: int = KEY_BYTES_LEN + KEY_CHECKSUM_LEN  # 35 bytes
KEY_TOTAL_CHARS: int = 56
BASE32_ALPHABET: str = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

# Cryptography constants
NONCE_LENGTH: int = 12  # 96-bit AES-GCM nonce
GCM_TAG_LENGTH: int = 16  # 128-bit authentication tag
HEADER_LENGTH: int = 1 + 2 + NONCE_LENGTH  # version (1) + length (2) + nonce (12) = 15 bytes

# API Limits (PRD Section 14.4)
MAX_UPLOAD_BYTES: int = 10 * 1024 * 1024  # 10 MB
MIN_IMAGE_DIM: int = 128
MAX_IMAGE_DIM: int = 4096
MAX_MESSAGE_BYTES: int = 4096  # 4 KB hard cap for v1

# Rate limiting
RATE_LIMIT_REQUESTS: int = 60
RATE_LIMIT_WINDOW_SECONDS: int = 60
