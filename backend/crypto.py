"""
Cryptographic module for Veil Steganography Platform.
Compliant with PRD Section 7 (Key design) and Section 8 (Cryptography specification).
"""

import base64
import hashlib
import os
import struct
from typing import Tuple

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from backend.config import (
    BASE32_ALPHABET,
    HEADER_LENGTH,
    KEY_BYTES_LEN,
    KEY_CHECKSUM_LEN,
    KEY_TOTAL_BYTES,
    KEY_TOTAL_CHARS,
    NONCE_LENGTH,
    PROTOCOL_VERSION,
)


class KeyValidationError(Exception):
    """Raised when a key string is malformed or fails its checksum."""
    pass


class DecryptionError(Exception):
    """Raised when payload decryption or authentication fails."""
    pass


def _compute_key_checksum(key_material: bytes) -> bytes:
    """Compute 3-byte SHA-256 checksum for master key verification."""
    digest = hashlib.sha256(b"veil-key-v1:" + key_material).digest()
    return digest[:KEY_CHECKSUM_LEN]


def generate_master_key() -> str:
    """
    Generate a 256-bit CSPRNG master key formatted as 56 Base32 characters
    grouped into 4-character hyphen-separated blocks (PRD 7.1, 7.2).
    """
    key_material = os.urandom(KEY_BYTES_LEN)
    checksum = _compute_key_checksum(key_material)
    total_bytes = key_material + checksum  # 35 bytes = 280 bits

    b32 = base64.b32encode(total_bytes).decode("ascii").rstrip("=")
    # Format into groups of 4: XXXX-XXXX-XXXX-... (14 groups of 4 = 56 chars)
    formatted = "-".join(b32[i : i + 4] for i in range(0, KEY_TOTAL_CHARS, 4))
    return formatted


def parse_and_verify_key(raw_key: str) -> bytes:
    """
    Normalize, parse, and verify a user-supplied key (PRD 7.2, D-2).
    Tolerates hyphens, spaces, and lowercase characters.
    Raises KeyValidationError if key syntax or checksum is invalid.
    """
    if not raw_key:
        raise KeyValidationError("Empty key provided.")

    # Strip whitespace, hyphens, and normalize to uppercase
    normalized = (
        raw_key.strip().replace("-", "").replace(" ", "").upper()
    )

    if len(normalized) != KEY_TOTAL_CHARS:
        raise KeyValidationError(
            f"Key must be exactly {KEY_TOTAL_CHARS} characters (received {len(normalized)})."
        )

    for char in normalized:
        if char not in BASE32_ALPHABET:
            raise KeyValidationError(f"Invalid character '{char}' in key.")

    try:
        # Base32 decode (35 bytes = 280 bits, no padding needed for 56 chars)
        decoded = base64.b32decode(normalized)
    except Exception as exc:
        raise KeyValidationError("Failed to decode Base32 key.") from exc

    if len(decoded) != KEY_TOTAL_BYTES:
        raise KeyValidationError("Invalid key payload length.")

    master_key = decoded[:KEY_BYTES_LEN]
    checksum = decoded[KEY_BYTES_LEN:]

    expected_checksum = _compute_key_checksum(master_key)
    if checksum != expected_checksum:
        raise KeyValidationError("Key checksum validation failed. Check for a typo.")

    return master_key


def derive_subkeys(master_key: bytes) -> Tuple[bytes, bytes, bytes]:
    """
    Derive independent subkeys using HKDF-SHA256 (PRD 7.3):
    - K_enc: AES-256-GCM encryption key
    - K_pos: Seed for keyed coefficient/position selection (CSPRNG)
    - K_meta: Reserved for header protection / metadata
    """
    def _hkdf(info_label: bytes) -> bytes:
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=info_label,
        )
        return hkdf.derive(master_key)

    k_enc = _hkdf(b"veil-v1-encryption-key")
    k_pos = _hkdf(b"veil-v1-position-selection")
    k_meta = _hkdf(b"veil-v1-metadata")

    return k_enc, k_pos, k_meta


def encrypt_payload(k_enc: bytes, plaintext: bytes) -> bytes:
    """
    Encrypt plaintext secret message with AES-256-GCM (PRD 8.1, 8.2).
    Layout before ECC:
    - version (1 byte)
    - length (2 bytes, big-endian)
    - nonce (12 bytes, CSPRNG)
    - ciphertext (len bytes)
    - GCM tag (16 bytes)
    Header (version + length + nonce = 15 bytes) is passed as Associated Data (AAD).
    """
    if len(plaintext) > 65535:
        raise ValueError("Plaintext exceeds maximum 16-bit length (65535 bytes).")

    nonce = os.urandom(NONCE_LENGTH)
    version_byte = bytes([PROTOCOL_VERSION])
    length_bytes = struct.pack(">H", len(plaintext))
    aad = version_byte + length_bytes + nonce  # 15 bytes AAD

    aesgcm = AESGCM(k_enc)
    ciphertext_and_tag = aesgcm.encrypt(nonce, plaintext, aad)

    return aad + ciphertext_and_tag


def decrypt_payload(k_enc: bytes, payload: bytes) -> bytes:
    """
    Decrypt and authenticate AES-256-GCM payload (PRD 8.1, 8.2, D-4).
    Returns exact plaintext or raises DecryptionError on tampering or wrong key.
    """
    min_length = HEADER_LENGTH + 16  # 15 bytes header + 16 bytes GCM tag
    if len(payload) < min_length:
        raise DecryptionError("Payload shorter than minimum authenticated frame.")

    version = payload[0]
    if version != PROTOCOL_VERSION:
        raise DecryptionError(f"Unsupported payload version: {version}")

    expected_len = struct.unpack(">H", payload[1:3])[0]
    nonce = payload[3:15]
    aad = payload[:HEADER_LENGTH]
    ciphertext_and_tag = payload[HEADER_LENGTH:]

    if len(ciphertext_and_tag) != expected_len + 16:
        raise DecryptionError("Payload ciphertext length does not match header length.")

    aesgcm = AESGCM(k_enc)
    try:
        plaintext = aesgcm.decrypt(nonce, ciphertext_and_tag, aad)
        return plaintext
    except Exception as exc:
        raise DecryptionError("Authentication or decryption failed.") from exc
