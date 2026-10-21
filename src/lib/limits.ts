export const maxBytes = 10 * 1024 * 1024; // 10 MB
export const minDim = 128;
export const maxDim = 4096;
export const maxMessageBytes = 4096;

/**
 * Core image and payload limits for the Veil platform.
 * Tunable constants aligned with the PRD Section 14.4.
 */
export const LIMITS = {
  /** Maximum image upload size: 10 MB */
  MAX_IMAGE_BYTES: maxBytes,
  /** Minimum image width and height: 128px */
  MIN_IMAGE_DIM: minDim,
  /** Maximum image width and height: 4096px */
  MAX_IMAGE_DIM: maxDim,
  /** Hard cap on secret message length for v1: 4 KB (4096 bytes) */
  MAX_MESSAGE_BYTES: maxMessageBytes,
  /** Allowed MIME types */
  ALLOWED_MIME_TYPES: ['image/png', 'image/jpeg', 'image/bmp'] as const,
  /** Allowed file extensions */
  ALLOWED_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.bmp'] as const,
} as const;

