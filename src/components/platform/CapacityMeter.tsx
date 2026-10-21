import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { maxMessageBytes } from '@/lib/limits';
import { platformContent } from '@/content/platform';
import { Skeleton } from '@/components/ui/Skeleton';

export interface CapacityMeterProps {
  used: number;
  capacity: number | null;
  loading?: boolean;
  className?: string;
}

/**
 * CapacityMeter
 * - Displays a 6px pill bar on a sand track with forest or error fill.
 * - Debounces display updates by 150ms.
 * - Enforces the 4096-byte hard cap.
 * - Fully accessible progressbar with aria-valuetext.
 * - Skeleton placeholder during loading.
 */
export const CapacityMeter: React.FC<CapacityMeterProps> = ({
  used,
  capacity,
  loading = false,
  className = '',
}) => {
  const [debouncedUsed, setDebouncedUsed] = useState(used);

  // Debounce updates by 150ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedUsed(used);
    }, 150);
    return () => clearTimeout(handler);
  }, [used]);

  // Enforce hard cap of 4096 bytes
  const effectiveCapacity =
    capacity !== null ? Math.min(capacity, maxMessageBytes) : null;

  // Loading skeleton state
  if (loading && effectiveCapacity === null) {
    return (
      <div className={`w-full space-y-2 ${className}`} aria-busy="true">
        <Skeleton height={6} rounded="pill" />
        <Skeleton height={14} width="160px" />
      </div>
    );
  }

  // If no capacity yet and not loading, render null
  if (effectiveCapacity === null) {
    return null;
  }

  const isOverCapacity = debouncedUsed > effectiveCapacity;
  const percentage = Math.min(100, Math.max(0, (debouncedUsed / effectiveCapacity) * 100));

  const captionText = isOverCapacity
    ? platformContent.capacityMeter.overCapacityCaption(debouncedUsed - effectiveCapacity)
    : platformContent.capacityMeter.usedCaption(debouncedUsed, effectiveCapacity);

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {/* 6px Bar Track */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={effectiveCapacity}
        aria-valuenow={debouncedUsed}
        aria-valuetext={captionText}
        className="h-[6px] w-full rounded-pill bg-sand overflow-hidden relative"
      >
        <div
          className={`h-full rounded-pill transition-all duration-150 ${
            isOverCapacity ? 'w-full bg-error' : 'bg-forest'
          }`}
          style={{ width: isOverCapacity ? '100%' : `${percentage}%` }}
        />
      </div>

      {/* Caption beneath */}
      <div className="flex items-center gap-1.5 text-sm font-sans">
        {isOverCapacity ? (
          <>
            <AlertCircle className="w-4 h-4 text-error shrink-0 stroke-[1.5]" aria-hidden="true" />
            <span className="text-error font-medium">{captionText}</span>
          </>
        ) : (
          <span className="text-ink-soft">{captionText}</span>
        )}
      </div>
    </div>
  );
};
