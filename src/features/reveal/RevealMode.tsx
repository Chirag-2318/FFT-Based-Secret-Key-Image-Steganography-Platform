import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchX, Check, Copy } from 'lucide-react';
import { useRevealFlow } from './useRevealFlow';
import {
  Dropzone,
  KeyInput,
  ProgressPill,
  TypewriterText,
} from '@/components/platform';
import { Button } from '@/components/ui/Button';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { TextLink } from '@/components/ui/TextLink';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import { useSharingModal } from '@/components/layout/SharingModalContext';
import { platformContent } from '@/content/platform';
import { shellContent } from '@/content/shell';
import { isKeyComplete, verifyKeyChecksum } from '@/lib/key';

export interface RevealModeProps {
  className?: string;
}

/**
 * Copies text using modern clipboard API with execCommand fallback.
 * Strictly adheres to zero-persistence and no-console-logging rules.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';
  textArea.setAttribute('readonly', '');
  textArea.setAttribute('aria-hidden', 'true');
  document.body.appendChild(textArea);
  textArea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }
  document.body.removeChild(textArea);
  return success;
}

/**
 * RevealMode component (/app?mode=reveal)
 * Implements the 4 visual states of Reveal per design.md 6.3:
 * - State A: Empty (Dropzone, KeyInput with visible label, helper text, and submit button)
 * - State B: Revealing (ProgressPill "Looking for your message", inert inputs, 6s slow notice)
 * - State C: Success (Paper inset card, TypewriterText, Copy message, Reveal another)
 * - State D: Failure (Calm generic failure block, SearchX icon, Try again, Read sharing tips)
 *
 * Privacy Law: Key and message live strictly in memory; zero storage, zero URL presence, zero logging.
 */
export const RevealMode: React.FC<RevealModeProps> = ({ className = '' }) => {
  const {
    state,
    secondsLeft,
    isRateLimited,
    setFile,
    setKey,
    reveal,
    retry,
    reset,
  } = useRevealFlow();

  const { showToast } = useToast();

  // Try using SharingModalContext, fall back gracefully if not in provider
  let openSharingModalContext: (() => void) | undefined;
  try {
    const sharing = useSharingModal();
    openSharingModalContext = sharing.openSharingModal;
  } catch {
    openSharingModalContext = undefined;
  }

  const [isLocalSharingModalOpen, setIsLocalSharingModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const dropzoneContainerRef = useRef<HTMLDivElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  // Online / Offline tracking
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleOpenSharingTips = () => {
    if (openSharingModalContext) {
      openSharingModalContext();
    } else {
      setIsLocalSharingModalOpen(true);
    }
  };

  // Detect if user selected a non-PNG image (JPG/BMP)
  const isNonPng = Boolean(
    state.file &&
      (state.file.type ? state.file.type !== 'image/png' : !state.file.name.toLowerCase().endsWith('.png'))
  );

  // Key completeness and syntactic validity
  const isKeyValid = isKeyComplete(state.key) && verifyKeyChecksum(state.key);
  const hasImage = Boolean(state.file && state.previewUrl);
  const isRevealing = state.status === 'revealing';

  // Primary button enable condition: valid image + complete valid key + not revealing + not rate limited
  const isSubmitEnabled =
    hasImage && isKeyValid && !isRevealing && !isRateLimited && state.status !== 'success';

  const handleSubmit = useCallback(() => {
    if (!isSubmitEnabled) return;
    reveal();
  }, [isSubmitEnabled, reveal]);

  // Pressing Enter inside key input submits when valid
  const handleKeyInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isSubmitEnabled) {
        handleSubmit();
      }
    }
  };

  // Copy revealed message to clipboard
  const handleCopyMessage = async () => {
    if (state.status !== 'success') return;
    const success = await copyToClipboard(state.message);
    if (success) {
      setIsCopied(true);
      showToast(platformContent.revealMode.toastCopied);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // "Reveal another" resets everything and focuses dropzone
  const handleRevealAnother = () => {
    reset();
    setIsCopied(false);
    dropzoneContainerRef.current?.focus();
  };

  // "Try again" from generic failure preserves inputs and focuses key input
  const handleTryAgainFromFailure = () => {
    retry();
    // Focus key input so user can edit the key
    setTimeout(() => {
      keyInputRef.current?.focus();
    }, 50);
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Offline Sand Banner at TOP of Card */}
      {!isOnline && (
        <div className="mb-6">
          <InlineMessage variant="offline">
            {platformContent.revealMode.offlineBanner}
          </InlineMessage>
        </div>
      )}

      <AnimatePresence mode="wait">
        {state.status === 'success' ? (
          /* =========================================================================
             STATE C: SUCCESS VIEW
             ========================================================================= */
          <motion.div
            key="reveal-success-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Small success line (forest text + checkmark, announced via aria-live) */}
            <div className="flex items-center gap-2 text-forest">
              <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
              <span
                role="status"
                aria-live="polite"
                className="font-sans text-sm font-medium"
              >
                {platformContent.revealMode.successLine}
              </span>
            </div>

            {/* Paper Inset Card (radius 20px, 1px line border, padding 32px) */}
            <div className="bg-paper rounded-[20px] border border-line p-6 sm:p-8 space-y-4">
              <TypewriterText text={state.message} duration={1200} />
            </div>

            {/* Action Buttons: Primary Copy message, Secondary Reveal another */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Button
                variant="primary"
                onClick={handleCopyMessage}
                leadingIcon={
                  isCopied ? (
                    <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
                  )
                }
                fullWidthOnMobile
                className="flex-1"
              >
                {isCopied
                  ? platformContent.revealMode.copied
                  : platformContent.revealMode.copyMessage}
              </Button>

              <Button
                variant="secondary"
                onClick={handleRevealAnother}
                fullWidthOnMobile
                className="flex-1"
              >
                {platformContent.revealMode.revealAnother}
              </Button>
            </div>

            {/* Session privacy caption */}
            <p className="text-sm font-sans text-ink-soft pt-1">
              {platformContent.revealMode.sessionCaption}
            </p>
          </motion.div>
        ) : state.status === 'failed' ? (
          /* =========================================================================
             STATE D: GENERIC FAILURE (PRD D-3 and design.md 6.3 D)
             Calm block with SearchX icon, 1px error left border, serif H3
             ========================================================================= */
          <motion.div
            key="reveal-failure-view"
            role="alert"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Calm failure notification block */}
            <div className="bg-sand-soft/60 rounded-btn border border-line border-l-4 border-l-error p-6 space-y-3">
              <div className="flex items-center gap-3">
                <SearchX
                  className="w-6 h-6 text-error stroke-[1.5] shrink-0"
                  aria-hidden="true"
                />
                <h3 className="font-serif text-2xl sm:text-3xl font-normal text-ink">
                  {platformContent.revealMode.failureHeading}
                </h3>
              </div>
              <p className="font-sans text-base text-ink-soft leading-relaxed pl-9">
                {platformContent.revealMode.failureBody}
              </p>
            </div>

            {/* Actions: Primary Try again (preserves inputs), TextLink Read sharing tips */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Button
                variant="primary"
                onClick={handleTryAgainFromFailure}
                fullWidthOnMobile
                className="flex-1"
              >
                {platformContent.revealMode.tryAgain}
              </Button>

              <TextLink
                as="button"
                onClick={handleOpenSharingTips}
                className="text-sm font-medium py-2"
              >
                {platformContent.revealMode.readSharingTips}
              </TextLink>
            </div>
          </motion.div>
        ) : (
          /* =========================================================================
             STATES A & B: EMPTY / INPUTS FILLED / REVEALING
             ========================================================================= */
          <motion.div
            key="reveal-input-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Dropzone in reveal mode */}
            <div ref={dropzoneContainerRef} tabIndex={-1} className="space-y-3">
              <Dropzone
                mode="reveal"
                file={state.file}
                previewUrl={state.previewUrl}
                onFile={setFile}
                onClear={() => setFile(null)}
              />

              {/* Non-PNG advisory note: does not block the user */}
              {isNonPng && (
                <InlineMessage variant="note">
                  {platformContent.revealMode.nonPngNote}
                </InlineMessage>
              )}
            </div>

            {/* Key Input with visible label and helper text */}
            <div className="space-y-2">
              <label
                htmlFor="reveal-key-input"
                className="block font-sans font-medium text-base text-ink"
              >
                {platformContent.revealMode.keyFieldLabel}
              </label>

              <KeyInput
                ref={keyInputRef}
                id="reveal-key-input"
                value={state.key}
                onChange={setKey}
                onKeyDown={handleKeyInputKeyDown}
                disabled={isRevealing}
              />

              <p className="font-sans text-sm text-ink-soft">
                {platformContent.revealMode.keyHelperText}
              </p>
            </div>

            {/* Action Area: Primary Button or Progress Pill */}
            <div className="space-y-3 pt-2">
              {isRevealing ? (
                <div className="space-y-2">
                  <ProgressPill label={platformContent.revealMode.revealingLabel} />
                  {/* Slow notice after 6 seconds */}
                  {state.slowNotice && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="text-center font-sans text-sm text-ink-soft animate-in fade-in duration-200"
                    >
                      {platformContent.revealMode.slowNotice}
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={!isSubmitEnabled}
                  fullWidthOnMobile
                  className="w-full"
                >
                  {platformContent.revealMode.submitAction}
                </Button>
              )}

              {/* Other error mappings beneath Primary Button */}
              {state.status === 'error' && (
                <div className="pt-2">
                  {state.error.kind === 'rate_limited' && (
                    <InlineMessage variant="error">
                      {platformContent.revealMode.errorRateLimited}{' '}
                      <span className="font-semibold">
                        {platformContent.revealMode.rateLimitCountdown(secondsLeft)}
                      </span>
                    </InlineMessage>
                  )}

                  {state.error.kind === 'server' && (
                    <div className="space-y-3">
                      <InlineMessage variant="error">
                        {platformContent.revealMode.errorServer}
                      </InlineMessage>
                      <Button
                        variant="secondary"
                        size="nav"
                        onClick={handleSubmit}
                        className="mt-1"
                      >
                        {platformContent.revealMode.tryAgain}
                      </Button>
                    </div>
                  )}

                  {state.error.kind === 'malformed_key' && (
                    <InlineMessage variant="error">
                      {platformContent.revealMode.malformedKey}
                    </InlineMessage>
                  )}

                  {(state.error.kind === 'network' || state.error.kind === 'offline') && (
                    <InlineMessage variant="offline">
                      {platformContent.revealMode.offlineBanner}
                    </InlineMessage>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fallback Sharing Guidance Modal */}
      {!openSharingModalContext && (
        <Modal
          isOpen={isLocalSharingModalOpen}
          onClose={() => setIsLocalSharingModalOpen(false)}
          title={shellContent.sharingModal.title}
        >
          <div className="space-y-6">
            <div>
              <h3 className="t-h3 font-serif font-normal text-ink mb-1">
                {shellContent.sharingModal.title}
              </h3>
            </div>

            <div className="space-y-3.5 font-sans text-base text-ink leading-relaxed">
              <p>{shellContent.sharingModal.tip1}</p>
              <p>{shellContent.sharingModal.tip2}</p>
              <p>{shellContent.sharingModal.tip3}</p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button variant="primary" onClick={() => setIsLocalSharingModalOpen(false)}>
                {shellContent.sharingModal.closeAction}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
