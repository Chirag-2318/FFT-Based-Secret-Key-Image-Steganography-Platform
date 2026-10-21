import React from 'react';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { ProofSection } from '@/components/landing/Proof/Proof';
import { PrivacySection } from '@/components/landing/Privacy/Privacy';
import { LimitsSection } from '@/components/landing/Limits/Limits';
import { ClosingSection } from '@/components/layout/ClosingSection';

/**
 * Landing Page: Assembles the Hero, HowItWorks, Proof, Privacy, Limits, and Closing sections.
 * Strictly respects design.md rules: one idea per section, generous whitespace,
 * max-width 1160px, and zero entrance animations.
 */
export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* 1. Signature Hero Section */}
      <Hero />

      {/* 2. How It Works (id="how") */}
      <HowItWorks />

      {/* 3. Before / After Proof Comparison */}
      <ProofSection />

      {/* 4. Privacy Guarantee Panel (id="privacy") */}
      <PrivacySection />

      {/* 5. Known Limitations (id="limits") */}
      <LimitsSection />

      {/* 6. Closing Dark Curved Section */}
      <ClosingSection />
    </div>
  );
};
