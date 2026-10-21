import React from 'react';
import { Headline } from '@/components/ui';
import { landingContent } from '@/content/landing';

export const LimitsSection: React.FC = () => {
  const { headingLine1, headingLine2, statements } = landingContent.limits;

  return (
    <section
      id="limits"
      aria-label="Known limits"
      className="scroll-mt-28 max-w-[1160px] mx-auto px-4 sm:px-8 py-16 sm:py-32 pb-24"
    >
      {/* Section Heading */}
      <div className="mb-14">
        <Headline line1={headingLine1} line2={headingLine2} size="h2" />
      </div>

      {/* Two-Column List of 4 Plain Statements with 1px Line Separators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-10 border-t border-line pt-10">
        {statements.map((st) => (
          <div key={st.id} className="space-y-2 border-b border-line/50 pb-8 md:border-b-0 md:pb-0">
            <p className="t-body text-ink leading-relaxed">
              <span>{st.prefix}</span>
              {st.highlight && (
                <strong className="font-semibold text-ink underline decoration-line decoration-1 underline-offset-4">
                  {st.highlight}
                </strong>
              )}
              <span>{st.suffix}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
