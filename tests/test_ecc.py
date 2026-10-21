"""
Unit tests for backend.ecc module.
Validates PRD Section 8.3 (Reed-Solomon Error Correcting Code).
"""

import pytest
from backend.ecc import ECCDecodeError, decode_ecc, encode_ecc


def test_reed_solomon_roundtrip():
    """ECC encoding and decoding without errors must recover original payload."""
    payload = b"Sample payload to be protected with Reed-Solomon parity."
    encoded = encode_ecc(payload, nsym=16)
    assert len(encoded) == len(payload) + 16

    decoded = decode_ecc(encoded, nsym=16)
    assert decoded == payload


def test_reed_solomon_error_correction():
    """ECC must correct injected byte errors within parity capacity (t = nsym // 2)."""
    payload = b"Critical message symbols requiring robustness against noise."
    nsym = 16  # Can correct up to 8 symbol errors
    encoded = bytearray(encode_ecc(payload, nsym=nsym))

    # Inject 5 byte errors at different positions
    error_positions = [2, 10, 20, 35, 45]
    for pos in error_positions:
        encoded[pos] ^= 0x55

    decoded = decode_ecc(bytes(encoded), nsym=nsym)
    assert decoded == payload


def test_reed_solomon_excessive_errors_fail():
    """Excessive errors exceeding correction capacity must raise ECCDecodeError."""
    payload = b"Short payload."
    nsym = 10  # Can correct up to 5 symbol errors
    encoded = bytearray(encode_ecc(payload, nsym=nsym))

    # Inject 8 byte errors (exceeds 5 error capacity)
    for i in range(8):
        encoded[i] ^= 0xFF

    with pytest.raises(ECCDecodeError):
        decode_ecc(bytes(encoded), nsym=nsym)
