import React from 'react';
import { PixelGrid } from '@/components/ui/PixelGrid';

export interface ProgressPillProps {
  label: string;
  className?: string;
  id?: string;
}

/**
 * ProgressPill (design.md 7.6)
 * 56px high pill with 2px ink border, paper fill, and animated 6x4 PixelGrid.
 * Replaces the primary action button in place to prevent layout shift.
 * Role="status", aria-live="polite".
 */
export const ProgressPill: React.FC<ProgressPillProps> = ({
  label,
  className = '',
  id,
}) => {
  return (
    <div
      id={id}
      role="status"
      aria-live="polite"
      className={`h-[56px] w-full rounded-pill border-2 border-ink bg-paper px-6 flex items-center justify-center gap-3 select-none text-ink ${className}`}
    >
      <PixelGrid cellSize={4} gap={2} animated className="text-ink" />
      <span className="font-sans text-base font-medium text-ink tracking-tight">
        {label}
      </span>
    </div>
  );
};
