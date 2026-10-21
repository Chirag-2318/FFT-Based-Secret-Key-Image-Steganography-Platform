import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';
import { shellContent } from '@/content/shell';

/**
 * ClosingSection meeting Section 4.7 & 5.7 of design.md.
 * Dark (--ink) curved section rising over the cream page (radius 48px, -48px overlap).
 * Rendered exclusively on the Landing page.
 */
export const ClosingSection: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative -mt-12 bg-ink text-cream rounded-t-[48px] pt-24 pb-16 px-4 sm:px-8 z-20">
      <div className="max-w-4xl mx-auto text-center space-y-10">
        {/* Headline */}
        <h2
          className="t-h2 font-serif font-normal text-cream"
          aria-label={`${shellContent.closingSection.line1} ${shellContent.closingSection.line2}`}
        >
          <span className="block" aria-hidden="true">
            {shellContent.closingSection.line1}
          </span>
          <span className="block italic" aria-hidden="true">
            {shellContent.closingSection.line2}
          </span>
        </h2>

        {/* Primary CTA (2px cream border used here for crisp contrast against ink background) */}
        <div className="flex justify-center pt-2">
          <Button
            as="link"
            to="/app"
            variant="primary"
            className="border-cream hover:bg-lavender-deep"
          >
            {shellContent.closingSection.cta}
          </Button>
        </div>

        {/* Footer Navigation Links */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-8 font-sans text-sm text-cream/75">
          <Link to="#how" className="hover:text-cream transition-colors duration-120">
            {shellContent.nav.howItWorks}
          </Link>
          <Link to="#privacy" className="hover:text-cream transition-colors duration-120">
            {shellContent.nav.privacy}
          </Link>
          <Link to="#limits" className="hover:text-cream transition-colors duration-120">
            {shellContent.nav.limits}
          </Link>
        </div>

        {/* Copyright notice */}
        <div className="pt-4 border-t border-cream/10 font-sans text-xs text-cream/50">
          <p>© {currentYear} {shellContent.closingSection.copyrightSuffix}</p>
        </div>
      </div>
    </footer>
  );
};
