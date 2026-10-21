import React, { useEffect, useState } from 'react';
import { useSearchParams, useBlocker } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Headline } from '@/components/ui/Headline';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import { DecorativeBackdrop } from '@/components/platform/DecorativeBackdrop';
import { HideMode } from '@/features/hide/HideMode';
import { RevealMode } from '@/features/reveal/RevealMode';
import { platformContent } from '@/content/platform';


/**
 * PlatformPage (/app)
 * Central platform card supporting Hide and Reveal modes with 180ms crossfade.
 * - Mode is mirrored in URL (?mode=hide|reveal) with automatic correction on invalid input.
 * - Zero persistence: no sensitive data in URL, storage, or history state.
 * - Route and mode-switching leave guard protecting unsaved secret keys.
 * - Subtle decorative curved SVG backdrop on large screens.
 */
export const PlatformPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isHideGuardActive, setIsHideGuardActive] = useState(false);

  // Read mode from searchParams (?mode=hide or ?mode=reveal)
  const rawMode = searchParams.get('mode');
  const mode = rawMode === 'reveal' ? 'reveal' : 'hide';
  const isHide = mode === 'hide';

  // Fallback and correct invalid query parameters
  useEffect(() => {
    if (rawMode !== 'hide' && rawMode !== 'reveal') {
      setSearchParams({ mode: 'hide' }, { replace: true });
    }
  }, [rawMode, setSearchParams]);

  // Update document title per mode
  useEffect(() => {
    document.title = isHide
      ? platformContent.pageFrame.docTitleHide
      : platformContent.pageFrame.docTitleReveal;
  }, [isHide]);

  // Set robots noindex for /app and restore on unmount (design.md & PRD)
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    let created = false;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
      created = true;
    }
    const prevContent = meta.content;
    meta.content = 'noindex, nofollow';

    return () => {
      if (created) {
        meta?.remove();
      } else if (meta) {
        meta.content = prevContent;
      }
    };
  }, []);

  // Leave Guard: intercept route transitions and mode changes when key is unsaved
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isHideGuardActive &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search)
  );

  return (
    <div className="relative min-h-[calc(100vh-120px)] pt-28 sm:pt-36 pb-32 px-4 overflow-hidden">
      {/* Decorative Curved Arcs Backdrop behind card on large screens (>=1280px) */}
      <DecorativeBackdrop />

      <div className="relative z-10 max-w-4xl mx-auto space-y-12">
        {/* Centered H1 Headline & Lead (mode-specific) */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <Headline
            line1={
              isHide
                ? platformContent.pageFrame.hideTitle
                : platformContent.pageFrame.revealTitle
            }
            line2={
              isHide
                ? platformContent.pageFrame.hideTitleItalic
                : platformContent.pageFrame.revealTitleItalic
            }
            size="h1"
            align="center"
          />
          <p className="t-lead text-ink-soft">
            {isHide
              ? platformContent.pageFrame.hideLead
              : platformContent.pageFrame.revealLead}
          </p>
        </div>

        {/* Main Card (max-width 760px, radius 24px, 1px line border, 40px padding / 20px mobile, 300ms ease-in-out height) */}
        <div className="bg-paper text-ink rounded-card border border-line p-5 sm:p-10 max-w-[760px] mx-auto shadow-none transition-[height] duration-300 ease-in-out">
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full"
            >
              {isHide ? (
                <HideMode onGuardChange={setIsHideGuardActive} />
              ) : (
                <RevealMode />
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Global Navigation Leave Guard Confirmation Modal */}
      <Modal
        isOpen={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title={platformContent.leaveGuard.title}
        description={platformContent.leaveGuard.body}
      >
        <div className="space-y-6">
          <div>
            <h3 className="font-serif text-2xl font-normal text-ink mb-2">
              {platformContent.leaveGuard.title}
            </h3>
            <p className="font-sans text-base text-ink-soft">
              {platformContent.leaveGuard.body}
            </p>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-4 pt-4">
            <TextLink
              as="button"
              onClick={() => blocker.proceed?.()}
              className="text-sm font-medium"
            >
              {platformContent.leaveGuard.leaveAction}
            </TextLink>

            <Button variant="primary" onClick={() => blocker.reset?.()}>
              {platformContent.leaveGuard.stayAction}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
