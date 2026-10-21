import React, { useState, useEffect } from 'react';
import { PanelChoose } from './Panels/PanelChoose';
import { PanelShareImage } from './Panels/PanelShareImage';
import { PanelShareKey } from './Panels/PanelShareKey';
import { useScrollSpy } from './useScrollSpy';
import { landingContent } from '@/content/landing';

export const HowItWorks: React.FC = () => {
  const { steps, detailsLink, detailsExpandedText } = landingContent.howItWorks;
  const { activeStep, registerStepRef, scrollToStep } = useScrollSpy(steps.length);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setIsReducedMotion(mq.matches);
    }
  }, []);

  const currentStep = steps[activeStep] ?? steps[0];

  return (
    <section
      id="how"
      aria-label="How it works"
      className="scroll-mt-28 max-w-[1160px] mx-auto px-4 sm:px-8 py-16 sm:py-32"
    >
      {/* 
        DESKTOP LAYOUT (>= 768px):
        Three-column scroll-spy layout with sticky index, sticky central media panel,
        and scrolling trigger markers.
      */}
      <div className="hidden md:block">
        <div className="relative grid grid-cols-12 gap-8 items-start">
          {/* Column 1 (Left): Sticky Scroll-Spy Index */}
          <div className="col-span-3 sticky top-36 space-y-6 pt-4">
            <nav aria-label="Steps index" className="flex flex-col space-y-4">
              {steps.map((step, index) => {
                const isActive = activeStep === index;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => scrollToStep(index)}
                    aria-current={isActive ? 'step' : undefined}
                    className="flex items-center gap-3.5 text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3 rounded-btn py-1"
                  >
                    {/* 3px vertical indicator bar */}
                    <span
                      className={`w-[3px] h-6 rounded-pill transition-colors duration-200 ${
                        isActive ? 'bg-ember' : 'bg-line group-hover:bg-sand'
                      }`}
                      aria-hidden="true"
                    />
                    {/* Serif 20px label */}
                    <span
                      className={`font-serif text-[20px] transition-colors duration-200 ${
                        isActive
                          ? 'text-ink font-normal'
                          : 'text-ink-soft group-hover:text-ink'
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Column 2 (Center): Sticky 500x580 Paper Media Panel */}
          <div className="col-span-5 sticky top-36 flex justify-center">
            <div className="w-full max-w-[500px] h-[540px] bg-paper rounded-card border border-line shadow-none overflow-hidden relative">
              {/* Panel 1: Choose a photo */}
              <div
                className={`absolute inset-0 transition-opacity ${
                  isReducedMotion ? 'duration-0' : 'duration-300'
                } ${activeStep === 0 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
              >
                <PanelChoose isActive={activeStep === 0} isStatic={isReducedMotion} />
              </div>

              {/* Panel 2: Share the image */}
              <div
                className={`absolute inset-0 transition-opacity ${
                  isReducedMotion ? 'duration-0' : 'duration-300'
                } ${activeStep === 1 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
              >
                <PanelShareImage isActive={activeStep === 1} isStatic={isReducedMotion} />
              </div>

              {/* Panel 3: Share the key separately */}
              <div
                className={`absolute inset-0 transition-opacity ${
                  isReducedMotion ? 'duration-0' : 'duration-300'
                } ${activeStep === 2 ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}
              >
                <PanelShareKey isActive={activeStep === 2} isStatic={isReducedMotion} />
              </div>
            </div>
          </div>

          {/* Column 3 (Right): Sticky Active Step Text & Scrolling Anchors */}
          <div className="col-span-4 sticky top-48 pt-4 space-y-4">
            <h3 className="t-h3 font-serif font-normal text-ink transition-opacity duration-200">
              {currentStep.h3}
            </h3>
            <p className="t-body text-ink-soft leading-relaxed transition-opacity duration-200">
              {currentStep.paragraph}
            </p>
          </div>
        </div>

        {/* Invisible scroll triggers spaced through ~3x viewport height */}
        <div className="relative -mt-[540px] pointer-events-none">
          <div ref={registerStepRef(0)} className="h-[75vh]" />
          <div ref={registerStepRef(1)} className="h-[75vh]" />
          <div ref={registerStepRef(2)} className="h-[75vh]" />
        </div>
      </div>

      {/* 
        MOBILE LAYOUT (< 768px):
        No sticky behavior, no scroll-spy. All three steps stacked vertically
        with their individual illustration panels, titles, and copy.
      */}
      <div className="md:hidden space-y-16">
        {steps.map((step, index) => (
          <div key={step.id} className="space-y-6">
            <div className="w-full aspect-[4/3] bg-paper rounded-card border border-line shadow-none overflow-hidden">
              {index === 0 && <PanelChoose isActive={true} isStatic={isReducedMotion} />}
              {index === 1 && <PanelShareImage isActive={true} isStatic={isReducedMotion} />}
              {index === 2 && <PanelShareKey isActive={true} isStatic={isReducedMotion} />}
            </div>

            <div className="space-y-2">
              <span className="font-serif text-sm text-ember font-medium">0{index + 1}</span>
              <h3 className="t-h3 font-serif font-normal text-ink">{step.h3}</h3>
              <p className="t-body text-ink-soft">{step.paragraph}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Expandable Technical Detail Under Section */}
      <div className="mt-16 pt-8 border-t border-line/60">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls="how-it-works-detail"
          className="group inline-flex items-center gap-1 font-sans text-base font-medium text-ink hover:underline cursor-pointer focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3 py-2"
        >
          <span>{detailsLink}</span>
          <span className="text-xs transition-transform duration-200 group-hover:translate-x-0.5">
            {isExpanded ? '↑' : '→'}
          </span>
        </button>

        {isExpanded && (
          <div
            id="how-it-works-detail"
            className="mt-4 p-6 bg-sand-soft rounded-card border border-line text-ink leading-relaxed font-sans text-base max-w-3xl animate-in fade-in duration-300"
          >
            <p>{detailsExpandedText}</p>
          </div>
        )}
      </div>
    </section>
  );
};
