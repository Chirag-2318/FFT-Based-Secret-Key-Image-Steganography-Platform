/**
 * Quality and capacity metrics returned by the encode process.
 * Aligned with PRD Section 14.3 and design.md Section 6.2 D4.
 */
export interface EncodeMetrics {
  /** Peak Signal-to-Noise Ratio in dB (e.g. 46.2) */
  psnr: number;
  /** Structural Similarity Index (e.g. 0.994) */
  ssim: number;
  /** Maximum safe capacity of the cover image in bytes */
  capacityBytes: number;
  /** Actual payload size embedded in bytes */
  usedBytes: number;
  /** Embedding density in bits per pixel */
  bpp: number;
}

/**
 * Result of a successful encode operation.
 * stegoUrl is forbidden on this type: object URLs must be created and tracked
 * solely by the UI/hook layer to guarantee safe cleanup and zero memory leaks.
 */
export interface EncodeResult {
  /** Lossless binary stego image (PNG) */
  stegoBlob: Blob;
  /** Explicitly disallowed on API result; managed by UI hook */
  stegoUrl?: never;
  /** Formatted secret key (RFC 4648 Base32, 56 characters) */
  key: string;
  /** Quality and capacity measurements */
  metrics: EncodeMetrics;
}

/**
 * Result of a successful decode operation.
 */
export interface DecodeResult {
  /** The extracted secret plaintext message */
  message: string;
}

/**
 * Result of capacity probe.
 */
export interface CapacityResult {
  /** Maximum message capacity for the given image in bytes */
  capacityBytes: number;
}

/**
 * Discriminated union of API error kinds.
 * Matches design.md Section 6.4 and PRD Section 14.3 error taxonomy.
 */
export type ApiErrorKind =
  | 'invalid_input' // 400 from encode
  | 'malformed_key' // 400 from decode (checksum or format invalid)
  | 'too_large' // 413 file exceeds max upload limit (10 MB)
  | 'over_capacity' // 422 from encode, payload exceeds image room
  | 'decode_failed' // 422 from decode, deliberately generic (tampered, wrong key, compressed)
  | 'rate_limited' // 429 too many requests
  | 'server' // 5xx backend server error
  | 'offline' // fetch failed while navigator.onLine === false
  | 'network' // network drop or fetch error
  | 'aborted'; // request cancelled by user or timed out (60s)

/**
 * Standardized API Error class for all network, HTTP, and stego engine failures.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;
  readonly retryAfterSeconds?: number;
  readonly maxCapacityBytes?: number;

  constructor(
    kind: ApiErrorKind,
    message: string,
    options?: {
      status?: number;
      retryAfterSeconds?: number;
      maxCapacityBytes?: number;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = options?.status;
    this.retryAfterSeconds = options?.retryAfterSeconds;
    this.maxCapacityBytes = options?.maxCapacityBytes;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

/**
 * Common interface implemented by both the real HTTP client and mock client.
 */
export interface ApiClient {
  encode(file: File, message: string, signal?: AbortSignal): Promise<EncodeResult>;
  decode(file: File, key: string, signal?: AbortSignal): Promise<DecodeResult>;
  capacity(file: File, signal?: AbortSignal): Promise<CapacityResult>;
}
