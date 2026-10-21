"""
FastAPI application for Veil Steganography Platform.
Compliant with PRD Section 6.3, Section 14.3, Section 14.4, and frontend API contracts.
"""

import base64
import io
import time
from collections import defaultdict
from typing import Dict, List, Optional, Tuple

from fastapi import FastAPI, File, Form, HTTPException, Request, Response, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

from backend.config import (
    MAX_IMAGE_DIM,
    MAX_MESSAGE_BYTES,
    MAX_UPLOAD_BYTES,
    MIN_IMAGE_DIM,
    RATE_LIMIT_REQUESTS,
    RATE_LIMIT_WINDOW_SECONDS,
)
from backend.crypto import KeyValidationError
from backend.metrics import calculate_capacity
from backend.stego import (
    StegoCapacityError,
    StegoDecodeError,
    decode_image,
    encode_image,
)

app = FastAPI(
    title="Veil Steganography API",
    description="Frequency-domain FFT steganography API with cryptographically authenticated keys.",
    version="1.0.0",
)

# CORS Configuration allowing frontend dev servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ============================================================================
# In-Memory Rate Limiting (PRD 6.3 H-5, Section 13)
# ============================================================================

class InMemoryRateLimiter:
    """
    Sliding window in-memory rate limiter per IP address.
    Zero persistence: stored strictly in memory and pruned continuously.
    """
    def __init__(self, limit: int = RATE_LIMIT_REQUESTS, window: int = RATE_LIMIT_WINDOW_SECONDS):
        self.limit = limit
        self.window = window
        self.requests: Dict[str, List[float]] = defaultdict(list)

    def is_allowed(self, client_ip: str) -> Tuple[bool, int]:
        now = time.time()
        timestamps = self.requests[client_ip]

        # Prune timestamps outside current window
        while timestamps and timestamps[0] <= now - self.window:
            timestamps.pop(0)

        if len(timestamps) >= self.limit:
            retry_after = int(math.ceil(self.window - (now - timestamps[0])))
            return False, max(1, retry_after)

        timestamps.append(now)
        return True, 0


import math

rate_limiter = InMemoryRateLimiter()


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Only rate-limit API operations
    if request.url.path.startswith("/api/v1/encode") or request.url.path.startswith("/api/v1/decode"):
        client_ip = request.client.host if request.client else "unknown"
        allowed, retry_after = rate_limiter.is_allowed(client_ip)
        if not allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "rate_limited"},
                headers={"Retry-After": str(retry_after)},
            )

    response = await call_next(request)
    return response


# ============================================================================
# Image Validation Helpers
# ============================================================================

SUPPORTED_FORMATS = {"PNG", "JPEG", "BMP"}


async def _read_and_validate_image(
    file: UploadFile,
    max_bytes: int = MAX_UPLOAD_BYTES,
) -> Tuple[bytes, int, int]:
    """
    Read uploaded image bytes and validate size and dimensions.
    Raises HTTPException (400, 413) on invalid inputs.
    """
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="That file is too large. The limit is 10 MB.",
        )

    try:
        img = Image.open(io.BytesIO(content))
        img_format = img.format
        width, height = img.size
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That file isn't a PNG, JPG or BMP image.",
        )

    if img_format not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="That file isn't a PNG, JPG or BMP image.",
        )

    if width < MIN_IMAGE_DIM or height < MIN_IMAGE_DIM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image dimensions ({width}x{height}) below minimum required {MIN_IMAGE_DIM}x{MIN_IMAGE_DIM}.",
        )

    if width > MAX_IMAGE_DIM or height > MAX_IMAGE_DIM:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image dimensions ({width}x{height}) exceed maximum allowed {MAX_IMAGE_DIM}x{MAX_IMAGE_DIM}.",
        )

    return content, width, height


# ============================================================================
# Endpoints (PRD Section 14.3)
# ============================================================================

@app.post("/api/v1/encode")
async def encode_endpoint(
    image: UploadFile = File(...),
    message: str = Form(...),
):
    """
    Hide / Encode endpoint:
    Accepts cover image + secret message.
    Returns JSON containing base64 stego PNG, Base32 key, and quality metrics.
    """
    if not message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Secret message cannot be empty.",
        )

    msg_bytes = message.encode("utf-8")
    if len(msg_bytes) > MAX_MESSAGE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={"detail": "over_capacity", "max_capacity_bytes": MAX_MESSAGE_BYTES},
        )

    cover_bytes, width, height = await _read_and_validate_image(image)

    try:
        stego_png_bytes, key_str, metrics = encode_image(cover_bytes, message)
    except StegoCapacityError as cap_err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "detail": "over_capacity",
                "max_capacity_bytes": cap_err.max_capacity_bytes,
                "message": str(cap_err),
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while encoding image.",
        ) from exc

    # Encode stego PNG to base64
    stego_base64 = base64.b64encode(stego_png_bytes).decode("ascii")

    return {
        "image_base64": stego_base64,
        "key": key_str,
        "metrics": metrics,
    }


@app.post("/api/v1/decode")
async def decode_endpoint(
    image: UploadFile = File(...),
    key: str = Form(...),
):
    """
    Reveal / Decode endpoint:
    Accepts stego PNG image + secret key in request body.
    Returns revealed secret message or generic calm failure.
    """
    stego_bytes, _, _ = await _read_and_validate_image(image)

    try:
        plaintext_message = decode_image(stego_bytes, key)
        return {"message": plaintext_message}
    except KeyValidationError:
        # PRD D-2: distinct 400 malformed key error catches typos
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="malformed_key",
        )
    except (StegoDecodeError, Exception):
        # PRD D-3, 9.4: Wrong key, modified image, or corrupted image all return
        # the same generic failure to avoid cryptographic oracle feedback.
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="decode_failed",
        )


@app.post("/api/v1/capacity")
@app.get("/api/v1/capacity")
async def capacity_endpoint(
    image: Optional[UploadFile] = File(None),
):
    """
    Capacity probe endpoint:
    Returns the maximum secret message size in bytes for the provided cover image.
    Supports both POST with file and fallback GET.
    """
    if not image:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image file required to probe capacity.",
        )

    _, width, height = await _read_and_validate_image(image)
    cap = calculate_capacity(width, height)

    return {
        "capacity_bytes": cap,
    }


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "veil-backend", "version": "1.0.0"}
