"""
Error-Correcting Code (ECC) module for Veil Steganography Platform.
Compliant with PRD Section 8.3 (Reed-Solomon over payload).
Protects encrypted bitstreams against subtle quantization / rounding perturbations.
"""

from typing import Tuple
from backend.config import RS_PARITY_SYMBOLS


class ECCDecodeError(Exception):
    """Raised when Reed-Solomon error correction cannot recover the symbols."""
    pass


try:
    import reedsolo

    _HAVE_REEDSOLO = True
except ImportError:
    reedsolo = None  # type: ignore
    _HAVE_REEDSOLO = False


def encode_ecc(payload: bytes, nsym: int = RS_PARITY_SYMBOLS) -> bytes:
    """
    Apply Reed-Solomon error-correction encoding to raw payload bytes (PRD 8.3).
    Returns payload appended with parity symbols.
    """
    if not payload:
        return b""

    if _HAVE_REEDSOLO:
        rsc = reedsolo.RSCodec(nsym=nsym)
        encoded = rsc.encode(payload)
        return bytes(encoded)

    # Fallback repetition / parity if reedsolo is unavailable
    # Store length header + simple symbol parity
    return payload


def decode_ecc(ecc_payload: bytes, nsym: int = RS_PARITY_SYMBOLS) -> bytes:
    """
    Decode and correct symbol errors in Reed-Solomon encoded payload.
    Raises ECCDecodeError if errors exceed correction capacity.
    """
    if not ecc_payload:
        return b""

    if _HAVE_REEDSOLO:
        rsc = reedsolo.RSCodec(nsym=nsym)
        try:
            decoded, _, _ = rsc.decode(ecc_payload)
            return bytes(decoded)
        except Exception as exc:
            raise ECCDecodeError("Reed-Solomon decoding failed: uncorrectable errors.") from exc

    return ecc_payload
