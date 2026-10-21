import { maxBytes, minDim, maxDim } from './limits';
import { platformContent } from '@/content/platform';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
  dimensions?: ImageDimensions;
}

/**
 * Reads image dimensions without drawing to a canvas.
 * Uses createImageBitmap if available, falling back to an Image element.
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { colorSpaceConversion: 'none' });
      const dimensions = { width: bitmap.width, height: bitmap.height };
      bitmap.close();
      return dimensions;
    } catch {
      // Fallback to Image element below
    }
  }

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(objectUrl);
      resolve(dimensions);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(platformContent.validation.wrongType));
    };

    img.src = objectUrl;
  });
}

/**
 * Validates an image file for type, size, and dimensions according to platform limits.
 * Returns exact error strings aligned with design.md and PRD.
 */
export async function validateImage(
  file: File,
  mode: 'hide' | 'reveal' = 'hide'
): Promise<ValidationResult> {
  // 1. MIME type / extension validation
  const validTypes = ['image/png', 'image/jpeg', 'image/bmp'];
  const fileName = file.name.toLowerCase();
  const hasValidExt =
    fileName.endsWith('.png') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.bmp');

  const hasValidMime = file.type ? validTypes.includes(file.type) : hasValidExt;

  if (!hasValidMime && !hasValidExt) {
    return {
      isValid: false,
      error: platformContent.validation.wrongType,
    };
  }

  // 2. File size validation (<= 10 MB)
  if (file.size > maxBytes) {
    const sizeInMb = Math.round(file.size / (1024 * 1024));
    return {
      isValid: false,
      error: platformContent.validation.tooBig(sizeInMb),
    };
  }

  // 3. Dimensions validation (128px to 4096px)
  try {
    const dimensions = await getImageDimensions(file);
    const { width, height } = dimensions;

    if (width < minDim || height < minDim) {
      return {
        isValid: false,
        error: platformContent.validation.tooSmall(width, height, mode),
        dimensions,
      };
    }

    if (width > maxDim || height > maxDim) {
      return {
        isValid: false,
        error: platformContent.validation.tooLarge(width, height, mode),
        dimensions,
      };
    }

    return {
      isValid: true,
      error: null,
      dimensions,
    };
  } catch {
    return {
      isValid: false,
      error: platformContent.validation.corruptImage,
    };
  }
}
