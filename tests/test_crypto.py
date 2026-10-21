"""
Unit tests for backend.crypto module.
Validates PRD Section 7 (Key design) and Section 8 (Cryptography specification).
"""

import pytest
from backend.crypto import (
    DecryptionError,
    KeyValidationError,
    decrypt_payload,
    derive_subkeys,
    encrypt_payload,
    generate_master_key,
    parse_and_verify_key,
)


def test_generate_and_parse_master_key():
    """Generated master key must parse and verify its built-in checksum."""
    key_str = generate_master_key()
    assert len(key_str.replace("-", "")) == 56
    assert len(key_str.split("-")) == 14

    # Tolerant parsing: spaces, lowercase, hyphens
    parsed1 = parse_and_verify_key(key_str)
    parsed2 = parse_and_verify_key(key_str.lower().replace("-", " "))
    assert parsed1 == parsed2
    assert len(parsed1) == 32


def test_malformed_key_detection():
    """Key with typo or invalid checksum must raise KeyValidationError (PRD D-2)."""
    valid_key = generate_master_key()

    # Shortened key
    with pytest.raises(KeyValidationError):
        parse_and_verify_key(valid_key[:30])

    # Altered character (checksum mismatch)
    chars = list(valid_key)
    # Flip one character
    chars[0] = "A" if chars[0] != "A" else "B"
    altered_key = "".join(chars)
    with pytest.raises(KeyValidationError):
        parse_and_verify_key(altered_key)


def test_derive_subkeys_distinctness():
    """HKDF must derive three distinct 32-byte subkeys from master key (PRD 7.3)."""
    master_key = parse_and_verify_key(generate_master_key())
    k_enc, k_pos, k_meta = derive_subkeys(master_key)

    assert len(k_enc) == 32
    assert len(k_pos) == 32
    assert len(k_meta) == 32
    assert k_enc != k_pos
    assert k_enc != k_meta
    assert k_pos != k_meta

    # Determinism check
    k_enc2, k_pos2, k_meta2 = derive_subkeys(master_key)
    assert k_enc == k_enc2
    assert k_pos == k_pos2
    assert k_meta == k_meta2


def test_aes_gcm_encrypt_decrypt_roundtrip():
    """AES-256-GCM encryption and decryption round-trip (PRD 8.1, 8.2)."""
    master_key = parse_and_verify_key(generate_master_key())
    k_enc, _, _ = derive_subkeys(master_key)

    plaintext = b"Top secret classified message for recipient Bob."
    payload = encrypt_payload(k_enc, plaintext)

    assert payload != plaintext
    recovered = decrypt_payload(k_enc, payload)
    assert recovered == plaintext


def test_tampered_ciphertext_fails_authentication():
    """Tampering with any byte of ciphertext or header must fail GCM tag (PRD D-4)."""
    master_key = parse_and_verify_key(generate_master_key())
    k_enc, _, _ = derive_subkeys(master_key)

    plaintext = b"Do not tamper with this communication."
    payload = bytearray(encrypt_payload(k_enc, plaintext))

    # Tamper with header byte (AAD)
    tampered_header = bytearray(payload)
    tampered_header[1] ^= 0x01
    with pytest.raises(DecryptionError):
        decrypt_payload(k_enc, bytes(tampered_header))

    # Tamper with ciphertext byte
    tampered_body = bytearray(payload)
    tampered_body[-5] ^= 0xFF
    with pytest.raises(DecryptionError):
        decrypt_payload(k_enc, bytes(tampered_body))
