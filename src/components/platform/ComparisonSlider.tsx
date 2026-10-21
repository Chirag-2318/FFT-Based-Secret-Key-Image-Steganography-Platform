import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chip } from '@/components/ui';
import { landingContent } from '@/content/landing';

export interface ComparisonSliderProps {
  originalSrc: string;
  stegoSrc: string;
  originalBlob?: Blob;
  stegoBlob?: Blob;
  originalLabel?: string;
  stegoLabel?: string;
  className?: string;
}

// In-memory cache for computed difference maps by URL pair
const diffCache = new Map<string, string>();

/**
 * Generates an amplified (50x) grayscale difference map on an offscreen canvas.
 * Uses colorSpaceConversion: 'none' and premultiplyAlpha: 'none' to preserve exact pixel data.
 */
async function generateDifferenceMap(originalSrc: string, stegoSrc: string): Promise<string> {
  const cacheKey = `${originalSrc}|${stegoSrc}`;
  if (diffCache.has(cacheKey)) {
    return diffCache.get(cacheKey)!;
  }

  // Fetch blobs if not already passed
  const [origBlob, stegoBlob] = await Promise.all([
    fetch(originalSrc).then((r) => r.blob()),
    fetch(stegoSrc).then((r) => r.blob()),
  ]);

  const [origBitmap, stegoBitmap] = await Promise.all([
    createImageBitmap(origBlob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }),
    createImageBitmap(stegoBlob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' }),
  ]);

  const width = Math.min(origBitmap.width, stegoBitmap.width);
  const height = Math.min(origBitmap.height, stegoBitmap.height);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get 2d canvas context');

  // Draw and get original image pixels
  ctx.drawImage(origBitmap, 0, 0, width, height);
  const origData = ctx.getImageData(0, 0, width, height);

  // Draw and get stego image pixels
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(stegoBitmap, 0, 0, width, height);
  const stegoData = ctx.getImageData(0, 0, width, height);

  const diffData = ctx.createImageData(width, height);
  const origPixels = origData.data;
  const stegoPixels = stegoData.data;
  const outPixels = diffData.data;

  const amplification = 50;
  const total = origPixels.length;

  for (let i = 0; i < total; i += 4) {
    const r1 = origPixels[i] ?? 0;
    const g1 = origPixels[i + 1] ?? 0;
    const b1 = origPixels[i + 2] ?? 0;

    const r2 = stegoPixels[i] ?? 0;
    const g2 = stegoPixels[i + 1] ?? 0;
    const b2 = stegoPixels[i + 2] ?? 0;

    const diffR = Math.abs(r1 - r2) * amplification;
    const diffG = Math.abs(g1 - g2) * amplification;
    const diffB = Math.abs(b1 - b2) * amplification;

    // Convert amplified difference to luminance (grayscale)
    const gray = Math.min(255, Math.round(0.299 * diffR + 0.587 * diffG + 0.114 * diffB));

    outPixels[i] = gray;
    outPixels[i + 1] = gray;
    outPixels[i + 2] = gray;
    outPixels[i + 3] = 255;
  }

  ctx.putImageData(diffData, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  diffCache.set(cacheKey, dataUrl);
  return dataUrl;
}

/**
 * ComparisonSlider meeting Section 7.5 of design.md.
 * Allows comparing original cover vs stego image with direct pointer manipulation,
 * keyboard accessibility, and an amplified 50x difference map toggle.
 */
export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  originalSrc,
  stegoSrc,
  originalLabel = landingContent.proof.originalLabel,
  stegoLabel = landingContent.proof.withMessageLabel,
  className = '',
}) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showDifference, setShowDifference] = useState<boolean>(false);
  const [diffMapSrc, setDiffMapSrc] = useState<string | null>(null);
  const [isLoadingDiff, setIsLoadingDiff] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  // Generate difference map on toggle
  useEffect(() => {
    if (showDifference && !diffMapSrc && !isLoadingDiff) {
      setIsLoadingDiff(true);
      generateDifferenceMap(originalSrc, stegoSrc)
        .then((url) => {
          setDiffMapSrc(url);
          setIsLoadingDiff(false);
        })
        .catch(() => {
          setIsLoadingDiff(false);
        });
    }
  }, [showDifference, diffMapSrc, isLoadingDiff, originalSrc, stegoSrc]);

  // Pointer position calculation
  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      updatePosition(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer was already released
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let delta = 0;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      delta = -2;
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      delta = 2;
    } else if (e.key === 'PageDown') {
      delta = -10;
    } else if (e.key === 'PageUp') {
      delta = 10;
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderPos(0);
      return;
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderPos(100);
      return;
    } else {
      return;
    }

    e.preventDefault();
    setSliderPos((prev) => Math.max(0, Math.min(100, prev + delta)));
  };

  const activeStegoSrc = showDifference && diffMapSrc ? diffMapSrc : stegoSrc;
  const roundedPos = Math.round(sliderPos);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Slider Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full aspect-[4/3] sm:aspect-[16/10] bg-cream rounded-card overflow-hidden border border-line select-none cursor-ew-resize touch-none"
      >
        {/* Underneath: Stego image (or difference map) */}
        <img
          src={activeStegoSrc}
          alt={showDifference ? 'Difference map amplified 50x' : 'Your image with the message hidden'}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Top layer: Original image clipped to slider position */}
        <div
          style={{
            clipPath: `inset(0 calc(100% - ${sliderPos}%) 0 0)`,
          }}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <img
            src={originalSrc}
            alt="Original cover image"
            className="w-full h-full object-cover pointer-events-none"
          />
        </div>

        {/* Vertical divider line */}
        <div
          style={{ left: `${sliderPos}%` }}
          className="absolute top-0 bottom-0 w-[2px] bg-paper border-x border-ink/20 -translate-x-1/2 pointer-events-none z-10"
        />

        {/* Draggable 44px handle button */}
        <div
          ref={handleRef}
          role="slider"
          tabIndex={0}
          aria-label={landingContent.proof.sliderAriaLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={roundedPos}
          aria-valuetext={`Showing ${roundedPos} percent original`}
          onKeyDown={handleKeyDown}
          style={{ left: `${sliderPos}%` }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 bg-paper border-2 border-ink rounded-pill flex items-center justify-center text-ink z-20 cursor-grab active:cursor-grabbing focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3"
        >
          {/* Double-arrow glyph */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 4L2 8L5 12" />
            <path d="M11 4L14 8L11 12" />
          </svg>
        </div>

        {/* Corner labels */}
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <span className="bg-paper/95 text-ink font-sans text-xs font-medium px-3 py-1.5 rounded-pill border border-line shadow-none">
            {originalLabel}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
          <span className="bg-paper/95 text-ink font-sans text-xs font-medium px-3 py-1.5 rounded-pill border border-line shadow-none">
            {showDifference ? 'Difference (50x)' : stegoLabel}
          </span>
        </div>
      </div>

      {/* Difference Map Toggle Chip & Caption */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <Chip pressed={showDifference} onToggle={setShowDifference}>
          {landingContent.proof.toggleChip}
        </Chip>

        {showDifference && (
          <p className="font-sans text-xs text-ink-soft">
            {landingContent.proof.caption}
          </p>
        )}
      </div>
    </div>
  );
};
