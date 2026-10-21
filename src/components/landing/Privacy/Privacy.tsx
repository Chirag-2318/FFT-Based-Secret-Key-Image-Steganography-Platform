import React from 'react';
import { Headline, TextLink } from '@/components/ui';
import { landingContent } from '@/content/landing';

export const PrivacySection: React.FC = () => {
  const { headingLine1, headingLine2, paragraph, linkText, badges } = landingContent.privacy;

  return (
    <section
      id="privacy"
      aria-label="Privacy guarantee"
      className="scroll-mt-28 max-w-[1160px] mx-auto px-4 sm:px-8 py-16 sm:py-32"
    >
      {/* 
        Sand feature panel: 40px radius, 56px (p-8 sm:p-14) padding.
        Responsive: 3 columns on desktop (>=1280px), 2 columns on tablet (<1280px),
        1 column on mobile (<768px).
      */}
      <div className="bg-sand rounded-panel p-8 sm:p-14">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-10 items-center">
          {/* Column 1: Serif Heading (stays upright + italic) */}
          <div className="xl:col-span-4">
            <Headline line1={headingLine1} line2={headingLine2} size="h2" />
          </div>

          {/* Column 2: Plain Paragraph & Link */}
          <div className="xl:col-span-5 space-y-4">
            <p className="t-body text-ink leading-relaxed font-sans font-normal">
              {paragraph}
            </p>
            <div>
              <TextLink to="#limits" withChevron>
                {linkText}
              </TextLink>
            </div>
          </div>

          {/* Column 3: Three Circular Outlined Badges */}
          <div className="md:col-span-2 xl:col-span-3 flex flex-wrap items-center justify-start xl:justify-end gap-4 pt-4 md:pt-0">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className="w-24 h-24 rounded-pill border-[1.5px] border-forest bg-transparent flex flex-col items-center justify-center text-center p-2 select-none"
              >
                <span className="font-sans font-semibold text-xs tracking-tight text-forest">
                  {badge.title}
                </span>
                <span className="font-sans text-[11px] text-forest/75 mt-0.5">
                  {badge.subtitle}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
