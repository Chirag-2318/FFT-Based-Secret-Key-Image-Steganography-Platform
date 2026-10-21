import React, { useState, useEffect, useRef } from 'react';
import { Headline, Button } from '@/components/ui';
import { HeroRing } from './HeroRing';
import { HeroRibbon } from './HeroRibbon';
import { HeroDebugControls } from './HeroDebugControls';
import { heroConfig } from '@/content/hero';

/**
 * Landing Page Hero component.
 * Features optically centered text content with the signature secret-sentence dissolve animation.
 * All animations are SVG + CSS transforms only (zero canvas, zero third-party animation libraries).
 */
export const Hero: React.FC = () => {
  const containerRef = useRef<HTMLElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isStatic, setIsStatic] = useState(false);

  // 1. Accessibility: Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setIsStatic(true);
    }

    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setIsStatic(true);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 2. Performance: Frame-rate probe measuring ~30 requestAnimationFrame deltas on mount.
  // If the measured average drops below 40fps, we gracefully degrade to the static frame.
  useEffect(() => {
    if (typeof window === 'undefined' || isStatic) return;

    let frameCount = 0;
    let startTime: number | null = null;
    let rafId: number;

    const measureFps = (now: number) => {
      if (startTime === null) {
        startTime = now;
      }
      frameCount++;

      if (frameCount < 30) {
        rafId = requestAnimationFrame(measureFps);
      } else {
        const elapsedSec = (now - startTime) / 1000;
        const fps = elapsedSec > 0 ? frameCount / elapsedSec : 60;
        // If average performance drops below 40fps, degrade to static frame to prevent jank
        if (fps < 40) {
          setIsStatic(true);
        }
      }
    };

    rafId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(rafId);
  }, [isStatic]);

  // 3. Performance: Pause animations when tab is hidden (Page Visibility API)
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 4. Performance: Pause animations when Hero is scrolled out of viewport (IntersectionObserver)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsPaused(!entry.isIntersecting);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={containerRef}
      className={`relative min-h-[calc(100vh-80px)] flex flex-col justify-center items-center px-4 pt-28 pb-16 overflow-hidden ${
        isPaused ? 'hero-animation-paused' : ''
      }`}
    >
      {/* 
        PIECE 1: THE RING
        A loose circular SVG ring carrying secret text fragments rotating linearly behind the headline.
        Positioned behind text content via -z-10.
      */}
      <HeroRing isStatic={isStatic} />

      {/* 
        ACCESSIBILITY & SEMANTICS:
        Real text content appears first in reading order.
        Text block max-width: 720px, optically centered on cream background.
      */}
      <div className="relative z-10 w-full max-w-[720px] mx-auto text-center space-y-6">
        {/* Only small caps label on the site */}
        <p className="text-sm uppercase tracking-[0.12em] text-ink-soft font-sans font-medium">
          {heroConfig.labels.eyebrow}
        </p>

        {/* Hero Headline */}
        <Headline
          line1={heroConfig.headline.line1}
          line2={heroConfig.headline.line2}
          size="hero"
          align="center"
        />

        {/* Hero Lead */}
        <p className="t-lead text-ink-soft max-w-[620px] mx-auto leading-relaxed">
          {heroConfig.labels.lead}
        </p>

        {/* Action Button & Caption */}
        <div className="pt-2 flex flex-col items-center justify-center gap-2">
          <Button as="link" to="/app" variant="primary">
            {heroConfig.labels.ctaButton}
          </Button>
          <span className="text-xs sm:text-sm font-sans text-ink-soft">
            {heroConfig.labels.buttonCaption}
          </span>
        </div>

        {/* 
          PIECE 2 (MOBILE VIEWPORT):
          Placed below CTA on screens < 768px so it never collides with headline.
        */}
        <div className="md:hidden pt-8 flex justify-center">
          <HeroRibbon isStatic={isStatic} />
        </div>

        {/* Availability Line */}
        <div className="pt-6">
          <p className="text-xs sm:text-sm font-sans text-ink-soft">
            {heroConfig.labels.availability}
          </p>
        </div>
      </div>

      {/* 
        PIECE 2 (DESKTOP VIEWPORT):
        Tilted -8deg band sweeping in from the right edge with PixelGrid waveform pill
        and character dissolve into grain.
      */}
      <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 lg:translate-x-4 pointer-events-none z-10">
        <HeroRibbon isStatic={isStatic} />
      </div>

      {/* Dev-only controls: visible only with ?debug in URL */}
      <HeroDebugControls
        isPaused={isPaused}
        isStatic={isStatic}
        onTogglePause={() => setIsPaused((prev) => !prev)}
        onToggleStatic={() => setIsStatic((prev) => !prev)}
      />
    </section>
  );
};
