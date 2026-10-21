import React, { useState, useId } from 'react';
import { HelpCircle } from 'lucide-react';
import { platformContent } from '@/content/platform';

export interface MetricsRowProps {
  psnr: number;
  ssim: number;
  usedBytes: number;
  capacityBytes: number;
  className?: string;
}

interface MetricItemProps {
  label: string;
  tooltipText: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, tooltipText }) => {
  const tooltipId = useId();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center gap-1.5 text-sm font-sans text-ink-soft">
      <span>{label}</span>
      <button
        type="button"
        aria-describedby={isOpen ? tooltipId : undefined}
        aria-label={`Information about ${label}`}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
        }}
        className="w-4 h-4 rounded-full flex items-center justify-center text-ink-soft hover:text-ink transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-2"
      >
        <HelpCircle className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
      </button>

      {/* Accessible Popover Tooltip */}
      {isOpen && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2.5 rounded-btn bg-paper border border-line text-xs font-sans text-ink z-20 pointer-events-none"
        >
          {tooltipText}
        </div>
      )}
    </div>
  );
};

/**
 * MetricsRow (design.md 6.2 D4)
 * Displays three technical quality metrics in plain words:
 * 1. PSNR (Quality) formatted to 1 decimal place.
 * 2. SSIM (Similarity) formatted to 3 decimal places.
 * 3. Payload capacity used vs total.
 * Fully keyboard-accessible tooltips with aria-describedby.
 */
export const MetricsRow: React.FC<MetricsRowProps> = ({
  psnr,
  ssim,
  usedBytes,
  capacityBytes,
  className = '',
}) => {
  const formattedPsnr = psnr.toFixed(1);
  const formattedSsim = ssim.toFixed(3);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-4 py-2 border-t border-line/60 ${className}`}
      aria-label="Image encoding metrics"
    >
      <MetricItem
        label={platformContent.metricsRow.qualityLabel(formattedPsnr)}
        tooltipText={platformContent.metricsRow.qualityTooltip}
      />
      <MetricItem
        label={platformContent.metricsRow.similarityLabel(formattedSsim)}
        tooltipText={platformContent.metricsRow.similarityTooltip}
      />
      <MetricItem
        label={platformContent.metricsRow.usedLabel(usedBytes, capacityBytes)}
        tooltipText={platformContent.metricsRow.usedTooltip}
      />
    </div>
  );
};
