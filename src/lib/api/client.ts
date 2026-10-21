import {
  ApiClient,
  EncodeResult,
  DecodeResult,
  CapacityResult,
  ApiError,
  EncodeMetrics,
} from './types';

/**
 * Base URL for the Veil backend API.
 * Configurable via VITE_API_BASE_URL (defaults to /api/v1).
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * HTTP Method for the capacity endpoint.
 *
 * NOTE: The PRD Section 14.3 drafts "GET /capacity" accepting an image, but HTTP
 * specifications disallow request bodies on GET requests. We implement POST with multipart.
 * TODO: Confirm the final method and path with the backend teammate.
 */
export const CAPACITY_METHOD: 'POST' | 'GET' = 'POST';

/**
 * 60-second request timeout in milliseconds per PRD and design guidelines.
 */
const REQUEST_TIMEOUT_MS = 60_000;

/**
 * Combines a 60-second timeout signal with an optional caller-provided AbortSignal.
 */
function createTimeoutSignal(callerSignal?: AbortSignal): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort(new Error('Request timed out after 60 seconds'));
  }, REQUEST_TIMEOUT_MS);

  const cleanup = () => clearTimeout(timer);

  if (!callerSignal) {
    return { signal: timeoutController.signal, cleanup };
  }

  if (callerSignal.aborted) {
    timeoutController.abort(callerSignal.reason);
    cleanup();
    return { signal: callerSignal, cleanup: () => {} };
  }

  if (typeof AbortSignal.any === 'function') {
    const combined = AbortSignal.any([timeoutController.signal, callerSignal]);
    return { signal: combined, cleanup };
  }

  const combinedController = new AbortController();
  const onAbort = () => {
    cleanup();
    combinedController.abort();
  };

  timeoutController.signal.addEventListener('abort', onAbort, { once: true });
  callerSignal.addEventListener('abort', onAbort, { once: true });

  return { signal: combinedController.signal, cleanup };
}

/**
 * Converts a base64 string to a lossless image/png Blob without using Canvas.
 */
function base64ToPngBlob(base64: string): Blob {
  const cleanBase64 = base64.replace(/^data:image\/[a-z]+;base64,/, '');
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: 'image/png' });
}

/**
 * Parses the encode response.
 *
 * BACKEND TEAMMATE CONTRACT DECISION:
 * The PRD notes that the encode response format is pending finalization between:
 * Strategy 1: JSON response with base64 image ({"image_base64": "...", "key": "...", "metrics": {...}})
 * Strategy 2: multipart/mixed response with binary PNG part and JSON metadata part.
 *
 * This function detects Content-Type and supports both transparently.
 * IF YOUR BACKEND USES DIFFERENT KEYS: adjust the field mappings below.
 */
export async function parseEncodeResponse(response: Response): Promise<EncodeResult> {
  const contentType = response.headers.get('content-type') || '';

  // Strategy 2: multipart/mixed response
  if (contentType.includes('multipart/mixed')) {
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    const boundary = boundaryMatch ? boundaryMatch[1] || boundaryMatch[2] : null;

    if (!boundary) {
      throw new ApiError(
        'server',
        'Malformed multipart response from server (missing boundary)',
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const decoder = new TextDecoder();
    const fullText = decoder.decode(buffer);

    // Split parts using boundary
    const parts = fullText.split(`--${boundary}`);
    let stegoBlob: Blob | null = null;
    let key: string | null = null;
    let metrics: EncodeMetrics | null = null;

    for (const part of parts) {
      if (part.includes('image/png') || part.includes('name="image"')) {
        // Binary PNG part
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const rawBinary = part.slice(headerEnd + 4).replace(/\r\n$/, '');
          const bytes = new Uint8Array(rawBinary.length);
          for (let i = 0; i < rawBinary.length; i++) {
            bytes[i] = rawBinary.charCodeAt(i) & 0xff;
          }
          stegoBlob = new Blob([bytes], { type: 'image/png' });
        }
      } else if (part.includes('application/json') || part.includes('name="metadata"')) {
        const headerEnd = part.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const jsonText = part.slice(headerEnd + 4).replace(/\r\n$/, '');
          const data = JSON.parse(jsonText);
          key = data.key;
          metrics = {
            psnr: data.metrics?.psnr ?? 0,
            ssim: data.metrics?.ssim ?? 0,
            capacityBytes: data.metrics?.capacity_bytes ?? data.metrics?.capacityBytes ?? 0,
            usedBytes: data.metrics?.used_bytes ?? data.metrics?.usedBytes ?? 0,
            bpp: data.metrics?.bpp ?? 0,
          };
        }
      }
    }

    if (!stegoBlob || !key || !metrics) {
      throw new ApiError('server', 'Failed to parse multipart encode response parts', {
        status: response.status,
      });
    }

    return { stegoBlob, key, metrics };
  }

  // Strategy 3: Direct binary image/png response with metadata headers
  if (contentType.includes('image/png') || contentType.includes('application/octet-stream')) {
    const buffer = await response.arrayBuffer();
    const stegoBlob = new Blob([buffer], { type: 'image/png' });

    const key =
      response.headers.get('x-key') ||
      response.headers.get('key') ||
      response.headers.get('x-stego-key') ||
      '';

    const metrics: EncodeMetrics = {
      psnr: Number(response.headers.get('x-psnr') ?? 0),
      ssim: Number(response.headers.get('x-ssim') ?? 0),
      capacityBytes: Number(
        response.headers.get('x-capacity-bytes') ??
          response.headers.get('x-capacity') ??
          0
      ),
      usedBytes: Number(
        response.headers.get('x-used-bytes') ??
          response.headers.get('x-bytes-used') ??
          0
      ),
      bpp: Number(response.headers.get('x-bpp') ?? 0),
    };

    return {
      stegoBlob,
      key,
      metrics,
    };
  }

  // Strategy 1 (Default): JSON with image_base64
  const data = await response.json();
  const imageBase64 =
    data.image_base64 ||
    data.imageBase64 ||
    data.stego_image ||
    data.stegoImage ||
    data.image ||
    data.file;

  if (!imageBase64 || !data.key) {
    throw new ApiError('server', 'Invalid encode JSON payload: missing image or key', {
      status: response.status,
    });
  }

  const stegoBlob = base64ToPngBlob(imageBase64);
  const rawMetrics = data.metrics || data;
  const metrics: EncodeMetrics = {
    psnr: Number(rawMetrics.psnr ?? 0),
    ssim: Number(rawMetrics.ssim ?? 0),
    capacityBytes: Number(rawMetrics.capacity_bytes ?? rawMetrics.capacityBytes ?? rawMetrics.capacity ?? 0),
    usedBytes: Number(rawMetrics.used_bytes ?? rawMetrics.usedBytes ?? rawMetrics.bytes_used ?? 0),
    bpp: Number(rawMetrics.bpp ?? 0),
  };

  return {
    stegoBlob,
    key: data.key,
    metrics,
  };
}

/**
 * Handles HTTP error status mapping according to PRD 14.3 and design.md 6.4.
 */
async function handleHttpError(
  response: Response,
  context: 'encode' | 'decode' | 'capacity'
): Promise<never> {
  const status = response.status;

  // 429: Rate limited
  if (status === 429) {
    const retryAfterHeader = response.headers.get('retry-after');
    const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) || 60 : 60;
    throw new ApiError('rate_limited', "That's a lot of tries. Wait a minute and try again.", {
      status,
      retryAfterSeconds,
    });
  }

  // 413: File too large (>10 MB)
  if (status === 413) {
    throw new ApiError('too_large', 'That file is too large. The limit is 10 MB.', {
      status,
    });
  }

  // 5xx: Server error
  if (status >= 500) {
    throw new ApiError(
      'server',
      "Something went wrong on our side. Your files weren't saved. Try again.",
      { status }
    );
  }

  // Decode-specific error handling: generic decode failure for all unhandled cases
  if (context === 'decode') {
    if (status === 400) {
      throw new ApiError('malformed_key', "That key doesn't look right. Check for a typo.", {
        status,
      });
    }
    // Any other error on decode (including 422) is generic by design to prevent leakage
    throw new ApiError(
      'decode_failed',
      'Nothing to reveal. The key may be wrong, or the image may have been resized, compressed or edited.',
      { status }
    );
  }

  // Encode-specific error handling
  if (context === 'encode') {
    if (status === 400) {
      throw new ApiError('invalid_input', "That file isn't a PNG, JPG or BMP image.", {
        status,
      });
    }

    if (status === 422) {
      let maxCapacityBytes = 0;
      try {
        const body = await response.json();
        maxCapacityBytes = Number(body.max_capacity_bytes ?? body.maxCapacityBytes ?? 0);
      } catch {
        // Fallback if body is not JSON
      }
      throw new ApiError('over_capacity', 'Message exceeds image capacity.', {
        status,
        maxCapacityBytes,
      });
    }
  }

  // Fallback for capacity probe or unmapped codes
  throw new ApiError('server', `Request failed with status ${status}`, { status });
}

/**
 * Normalizes exceptions into typed ApiErrors.
 */
function handleFetchCatch(err: unknown): never {
  if (err instanceof ApiError) {
    throw err;
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new ApiError('offline', "You're offline.", { cause: err });
  }

  if (err instanceof DOMException && err.name === 'AbortError') {
    throw new ApiError('aborted', 'Request was cancelled.', { cause: err });
  }

  throw new ApiError('network', 'Unable to reach the server. Check your connection.', {
    cause: err,
  });
}

/**
 * Production implementation of the Veil API client.
 * Strictly adheres to zero persistence: no logging of keys or payloads.
 */
export const realClient: ApiClient = {
  async encode(file: File, message: string, signal?: AbortSignal): Promise<EncodeResult> {
    const { signal: effectiveSignal, cleanup } = createTimeoutSignal(signal);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('message', message);

      const response = await fetch(`${API_BASE_URL}/encode`, {
        method: 'POST',
        body: formData,
        signal: effectiveSignal,
        credentials: 'omit',
      });

      if (!response.ok) {
        await handleHttpError(response, 'encode');
      }

      return await parseEncodeResponse(response);
    } catch (err) {
      handleFetchCatch(err);
    } finally {
      cleanup();
    }
  },

  async decode(file: File, key: string, signal?: AbortSignal): Promise<DecodeResult> {
    const { signal: effectiveSignal, cleanup } = createTimeoutSignal(signal);
    try {
      const formData = new FormData();
      formData.append('image', file);
      // Key is strictly placed in the request body only, never in URL or headers
      formData.append('key', key);

      const response = await fetch(`${API_BASE_URL}/decode`, {
        method: 'POST',
        body: formData,
        signal: effectiveSignal,
        credentials: 'omit',
      });

      if (!response.ok) {
        await handleHttpError(response, 'decode');
      }

      const data = await response.json();
      return {
        message: data.message ?? data.text ?? data.secret_message ?? data.secretMessage ?? '',
      };
    } catch (err) {
      handleFetchCatch(err);
    } finally {
      cleanup();
    }
  },

  async capacity(file: File, signal?: AbortSignal): Promise<CapacityResult> {
    const { signal: effectiveSignal, cleanup } = createTimeoutSignal(signal);
    try {
      let response: Response;
      const formData = new FormData();
      formData.append('image', file);

      if (CAPACITY_METHOD === 'POST') {
        response = await fetch(`${API_BASE_URL}/capacity`, {
          method: 'POST',
          body: formData,
          signal: effectiveSignal,
          credentials: 'omit',
        });
        // Graceful fallback if backend defined capacity as GET
        if (response.status === 405) {
          response = await fetch(`${API_BASE_URL}/capacity`, {
            method: 'GET',
            signal: effectiveSignal,
            credentials: 'omit',
          });
        }
      } else {
        response = await fetch(`${API_BASE_URL}/capacity`, {
          method: 'GET',
          signal: effectiveSignal,
          credentials: 'omit',
        });
        // Graceful fallback if backend defined capacity as POST
        if (response.status === 405) {
          response = await fetch(`${API_BASE_URL}/capacity`, {
            method: 'POST',
            body: formData,
            signal: effectiveSignal,
            credentials: 'omit',
          });
        }
      }

      if (!response.ok) {
        await handleHttpError(response, 'capacity');
      }

      const data = await response.json();
      return {
        capacityBytes: Number(
          data.capacity_bytes ??
            data.capacityBytes ??
            data.capacity ??
            data.max_bytes ??
            data.maxBytes ??
            0
        ),
      };
    } catch (err) {
      handleFetchCatch(err);
    } finally {
      cleanup();
    }
  },
};
