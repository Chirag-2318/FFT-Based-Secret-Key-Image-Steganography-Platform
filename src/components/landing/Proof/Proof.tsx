import React from 'react';
import { Headline } from '@/components/ui';
import { ComparisonSlider } from '@/components/platform/ComparisonSlider';
import { PROOF } from '@/content/proof';
import { landingContent } from '@/content/landing';

export const ProofSection: React.FC = () => {
  const { headingLine1, headingLine2, devPlaceholder, metrics } = landingContent.proof;

  // In production builds, render nothing if real proof samples do not exist
  if (!PROOF) {
    if (!import.meta.env.DEV) {
      return null;
    }

    // Dev placeholder
    return (
      <section className="max-w-[1160px] mx-auto px-4 sm:px-8 py-16 sm:py-24 border-t border-line/60">
        <div className="text-center space-y-4 mb-8">
          <Headline line1={headingLine1} line2={headingLine2} size="h2" align="center" />
        </div>
        <div className="bg-sand-soft rounded-card border border-line p-12 text-center text-ink-soft font-sans text-sm max-w-xl mx-auto">
          <p className="font-medium text-ink mb-1">[Dev Mode Placeholder]</p>
          <p>{devPlaceholder}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-[1160px] mx-auto px-4 sm:px-8 py-16 sm:py-32 border-t border-line/60">
      <div className="text-center space-y-4 mb-12">
        <Headline line1={headingLine1} line2={headingLine2} size="h2" align="center" />
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        <ComparisonSlider
          originalSrc={PROOF.originalSrc}
          stegoSrc={PROOF.hiddenSrc}
        />

        {/* Honest Benchmark Figures Strip */}
        {(PROOF.psnr || PROOF.ssim || PROOF.bytesHidden) && (
          <div className="flex flex-wrap items-center justify-around gap-6 pt-4 border-t border-line/60 text-center font-sans">
            {PROOF.psnr && (
              <div title={metrics.qualityTooltip}>
                <span className="text-xs text-ink-soft block">{metrics.qualityLabel}</span>
                <span className="text-sm font-semibold text-ink">{PROOF.psnr} dB</span>
              </div>
            )}
            {PROOF.ssim && (
              <div title={metrics.similarityTooltip}>
                <span className="text-xs text-ink-soft block">{metrics.similarityLabel}</span>
                <span className="text-sm font-semibold text-ink">{PROOF.ssim}</span>
              </div>
            )}
            {PROOF.bytesHidden && (
              <div title={metrics.capacityTooltip}>
                <span className="text-xs text-ink-soft block">{metrics.capacityLabel}</span>
                <span className="text-sm font-semibold text-ink">{PROOF.bytesHidden} bytes</span>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
