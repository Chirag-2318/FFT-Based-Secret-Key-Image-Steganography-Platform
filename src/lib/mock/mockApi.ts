import {
  ApiClient,
  EncodeResult,
  DecodeResult,
  CapacityResult,
  ApiError,
  EncodeMetrics,
} from '../api/types';
import { KEY_ALPHABET, KEY_TOTAL_CHARS, formatKey, normalizeKey } from '../key';
import { getImageDimensions, validateImage } from '../validateImage';

/**
 * Module-level in-memory storage for mock sessions.
 * Never persists across page reloads and never touches localStorage/sessionStorage/cookies/IndexedDB.
 * Key: normalized 56-char key string -> Value: secret plaintext message.
 */
const mockSessionSecretStore = new Map<string, string>();

/**
 * Delays execution while respecting an optional AbortSignal.
 */
function delayWithSignal(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new ApiError('aborted', 'Request was cancelled.'));
    }

    const timer = setTimeout(() => {
      resolve();
    }, ms);

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer);
        reject(new ApiError('aborted', 'Request was cancelled.'));
      },
      { once: true }
    );
  });
}

/**
 * Computes mock capacity using the PRD formula:
 * floor((width * height) / 8 / 64 * 0.85) - 36, clamped to [0, 4096].
 */
export async function calculateMockCapacity(file: File): Promise<number> {
  const { width, height } = await getImageDimensions(file);
  const raw = Math.floor(((width * height) / 8 / 64) * 0.85) - 36;
  return Math.max(0, Math.min(4096, raw));
}

/**
 * Generates a mock 56-character key adhering to Base32 RFC 4648 alphabet.
 */
function generateMockKey(): string {
  const bytes = new Uint8Array(KEY_TOTAL_CHARS);
  crypto.getRandomValues(bytes);
  let raw = '';
  for (let i = 0; i < KEY_TOTAL_CHARS; i++) {
    const b = bytes[i];
    if (b !== undefined) {
      raw += KEY_ALPHABET[b % KEY_ALPHABET.length];
    }
  }
  return formatKey(raw);
}

/**
 * Mock API Client adhering to PRD specifications.
 * Allows complete frontend development and testing without the backend.
 */
export const mockClient: ApiClient = {
  async capacity(file: File, signal?: AbortSignal): Promise<CapacityResult> {
    // Capacity delay: 300ms
    await delayWithSignal(300, signal);

    const validation = await validateImage(file, 'hide');
    if (!validation.isValid) {
      throw new ApiError('invalid_input', validation.error ?? 'Invalid cover image.');
    }

    const capacityBytes = await calculateMockCapacity(file);
    return { capacityBytes };
  },

  async encode(file: File, message: string, signal?: AbortSignal): Promise<EncodeResult> {
    // Dev-only query parameter error forcing (?mock=rate_limit | ?mock=server | ?mock=slow)
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mockParam = params.get('mock');
      if (mockParam === 'rate_limit') {
        await delayWithSignal(300, signal);
        throw new ApiError('rate_limited', "That's a lot of tries. Wait a minute and try again.", {
          status: 429,
          retryAfterSeconds: 8,
        });
      }
      if (mockParam === 'server') {
        await delayWithSignal(300, signal);
        throw new ApiError(
          'server',
          "Something went wrong on our side. Your files weren't saved. Try again.",
          { status: 500 }
        );
      }
      if (mockParam === 'slow') {
        // Slow encode: 12 seconds to test slow notice
        await delayWithSignal(12000, signal);
      }
    }

    // Realistic delay: 1.5 to 3.5 seconds
    const encodeDelay = Math.floor(Math.random() * 2000) + 1500;
    await delayWithSignal(encodeDelay, signal);

    // Validate cover image
    const validation = await validateImage(file, 'hide');
    if (!validation.isValid) {
      throw new ApiError('invalid_input', validation.error ?? 'Invalid cover image.');
    }

    const maxCapacityBytes = await calculateMockCapacity(file);
    const usedBytes = new TextEncoder().encode(message).length;

    if (usedBytes > maxCapacityBytes) {
      throw new ApiError('over_capacity', 'Message exceeds image capacity.', {
        status: 422,
        maxCapacityBytes,
      });
    }

    // Wrap original file bytes as "stego" PNG blob (never canvas)
    const fileBuffer = await file.arrayBuffer();
    const stegoBlob = new Blob([fileBuffer], { type: 'image/png' });

    // Generate random key and store mapping in memory
    const key = generateMockKey();
    const normalizedKey = normalizeKey(key);
    mockSessionSecretStore.set(normalizedKey, message);

    // Generate plausible metrics
    const { width, height } = validation.dimensions ?? { width: 1920, height: 1080 };
    const bpp = Number(((usedBytes * 8) / (width * height)).toFixed(6));
    const psnr = Number((Math.random() * 4 + 44).toFixed(1)); // 44.0 - 48.0 dB
    const ssim = Number((Math.random() * 0.007 + 0.99).toFixed(3)); // 0.990 - 0.997

    const metrics: EncodeMetrics = {
      psnr,
      ssim,
      capacityBytes: maxCapacityBytes,
      usedBytes,
      bpp,
    };

    return {
      stegoBlob,
      key,
      metrics,
    };
  },

  async decode(_file: File, key: string, signal?: AbortSignal): Promise<DecodeResult> {
    // Realistic delay: 0.8 to 1.6 seconds
    const decodeDelay = Math.floor(Math.random() * 800) + 800;
    await delayWithSignal(decodeDelay, signal);

    // Check special magic test keys (per PRD and task spec)
    const normalized = normalizeKey(key);
    const upperKey = key.toUpperCase();

    if (upperKey.startsWith('AAAA-AAAA') || normalized.startsWith('AAAAAAAA')) {
      throw new ApiError('malformed_key', "That key doesn't look right. Check for a typo.", {
        status: 400,
      });
    }

    if (upperKey.startsWith('BBBB-BBBB') || normalized.startsWith('BBBBBBBB')) {
      throw new ApiError('rate_limited', "That's a lot of tries. Wait a minute and try again.", {
        status: 429,
        retryAfterSeconds: 8,
      });
    }

    if (upperKey.startsWith('CCCC-CCCC') || normalized.startsWith('CCCCCCCC')) {
      throw new ApiError(
        'server',
        "Something went wrong on our side. Your files weren't saved. Try again.",
        { status: 500 }
      );
    }

    if (upperKey.startsWith('DDDD-DDDD') || normalized.startsWith('DDDDDDDD')) {
      throw new ApiError('offline', "You're offline.");
    }

    // Look up secret message stored in this session
    const storedMessage = mockSessionSecretStore.get(normalized);
    if (storedMessage !== undefined) {
      return { message: storedMessage };
    }

    // Deliberately generic decode failure for all unmatched keys
    throw new ApiError(
      'decode_failed',
      'Nothing to reveal. The key may be wrong, or the image may have been resized, compressed or edited.',
      { status: 422 }
    );
  },
};
