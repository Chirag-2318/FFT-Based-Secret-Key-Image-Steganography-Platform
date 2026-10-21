import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHideFlow } from './useHideFlow';
import { DissolveOverlay } from './DissolveOverlay';
import {
  Dropzone,
  MessageField,
  CapacityMeter,
  ProgressPill,
  ComparisonSlider,
  KeyCard,
  MetricsRow,
  SharingNote,
} from '@/components/platform';
import { Button } from '@/components/ui/Button';
import { InlineMessage } from '@/components/ui/InlineMessage';
import { Modal } from '@/components/ui/Modal';
import { TextLink } from '@/components/ui/TextLink';
import { useToast } from '@/components/ui/ToastContext';
import { useCountdown } from '@/hooks/useCountdown';
import { platformContent } from '@/content/platform';
import { maxMessageBytes } from '@/lib/limits';

export interface HideModeProps {
  onGuardChange?: (shouldGuard: boolean) => void;
  className?: string;
}

export const HideMode: React.FC<HideModeProps> = ({
  onGuardChange,
  className = '',
}) => {
  const {
    state,
    setFile,
    setMessage,
    hide,
    reset,
    markKeySaved,
    markKeyCopied,
  } = useHideFlow();

  const { showToast } = useToast();

  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isLeaveGuardModalOpen, setIsLeaveGuardModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Dissolve animation state synchronization
  const [isAnimationRunning, setIsAnimationRunning] = useState(false);
  const [isAnimationDone, setIsAnimationDone] = useState(false);
  const [isResponseArrived, setIsResponseArrived] = useState(false);

  // Overlay bounding rects
  const [sourceRect, setSourceRect] = useState<DOMRect | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [containerRect, setContainerRect] = useState<DOMRect | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const prevFileRef = useRef<File | null>(null);

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

  // Rate-limit countdown
  const {
    secondsLeft: rateLimitSeconds,
    isActive: isRateLimited,
    start: startRateLimitCountdown,
  } = useCountdown(0);

  // Handle incoming rate-limit errors
  useEffect(() => {
    if (state.status === 'error' && state.error.kind === 'rate_limited') {
      const waitSeconds = state.error.retryAfterSeconds ?? 60;
      startRateLimitCountdown(waitSeconds);
    }
  }, [state, startRateLimitCountdown]);

  // Leave Guard: active while result is showing and key hasn't been saved/copied/downloaded
  const shouldGuard =
    state.status === 'done' && !state.keySaved && !state.keyCopied && !isDownloaded;

  useEffect(() => {
    onGuardChange?.(shouldGuard);
  }, [shouldGuard, onGuardChange]);

  // Window beforeunload prompt while guard is active
  useEffect(() => {
    if (!shouldGuard) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldGuard]);

  // Auto-focus MessageField when image transitions from empty to loaded
  useEffect(() => {
    if (state.file && !prevFileRef.current && textareaRef.current) {
      textareaRef.current.focus();
    }
    prevFileRef.current = state.file;
  }, [state.file]);

  // Listen for response arrival
  useEffect(() => {
    if (state.status === 'done') {
      setIsResponseArrived(true);
    } else if (state.status === 'error') {
      setIsAnimationRunning(false);
      setIsAnimationDone(false);
      setIsResponseArrived(false);
    }
  }, [state.status]);

  // Check if primary submit button should be enabled
  const hasValidImage = Boolean(state.file && state.dimensions);
  const trimmedMessage = state.message.trimEnd();
  const hasValidMessage = trimmedMessage.length > 0;
  const effectiveCapacity =
    state.capacityBytes !== null
      ? Math.min(state.capacityBytes, maxMessageBytes)
      : maxMessageBytes;
  const isWithinCapacity =
    state.usedBytes <= effectiveCapacity && state.usedBytes <= maxMessageBytes;
  const isHiding = state.status === 'hiding' || isAnimationRunning;

  const isSubmitEnabled =
    hasValidImage &&
    hasValidMessage &&
    isWithinCapacity &&
    !isHiding &&
    !isRateLimited &&
    state.status !== 'done';

  // Handle submit action
  const handleSubmit = useCallback(() => {
    if (!isSubmitEnabled) return;

    // Measure bounding rects for signature dissolve animation
    if (textareaRef.current && dropzoneRef.current && cardRef.current) {
      setSourceRect(textareaRef.current.getBoundingClientRect());
      setTargetRect(dropzoneRef.current.getBoundingClientRect());
      setContainerRect(cardRef.current.getBoundingClientRect());
    }

    setIsAnimationRunning(true);
    setIsAnimationDone(false);
    setIsResponseArrived(false);

    hide();
  }, [isSubmitEnabled, hide]);

  // Handle Cmd+Enter or Ctrl+Enter inside MessageField
  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isSubmitEnabled) {
        handleSubmit();
      }
    }
  };

  const handleAnimationComplete = useCallback(() => {
    setIsAnimationDone(true);
  }, []);

  // When BOTH animation and backend response have settled, finalize transition to Result
  const isReadyToShowResult =
    state.status === 'done' && isAnimationDone && isResponseArrived;

  // Handle Safe Reset (Hide another)
  const handleSafeReset = useCallback(() => {
    reset();
    setIsDownloaded(false);
    setIsAnimationRunning(false);
    setIsAnimationDone(false);
    setIsResponseArrived(false);
    setPendingAction(null);
    setIsLeaveGuardModalOpen(false);

    // Return focus to dropzone
    dropzoneRef.current?.focus();
  }, [reset]);

  const handleHideAnotherClick = () => {
    if (shouldGuard) {
      setPendingAction(() => handleSafeReset);
      setIsLeaveGuardModalOpen(true);
    } else {
      handleSafeReset();
    }
  };

  const handleDownloadImage = () => {
    if (state.status !== 'done') return;

    const baseName = state.file.name.replace(/\.[^/.]+$/, '') || 'image';
    const downloadFileName = `${baseName}-veil.png`;

    const blobUrl = URL.createObjectURL(state.result.stegoBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);

    showToast(platformContent.hideMode.toastDownloaded);
    setIsDownloaded(true);
  };

  return (
    <div ref={cardRef} className={`relative w-full ${className}`}>
      {/* Offline Sand Banner at TOP of Card */}
      {!isOnline && (
        <div className="mb-6">
          <InlineMessage variant="offline">
            {platformContent.hideMode.offlineBanner}
          </InlineMessage>
        </div>
      )}

      {/* Signature Dissolve Overlay */}
      {isAnimationRunning && !isReadyToShowResult && (
        <DissolveOverlay
          text={state.message}
          sourceRect={sourceRect}
          targetRect={targetRect}
          containerRect={containerRect}
          onAnimationComplete={handleAnimationComplete}
        />
      )}

      <AnimatePresence mode="wait">
        {isReadyToShowResult ? (
          /* =========================================================================
             STATE D: RESULT VIEW
             ========================================================================= */
          <motion.div
            key="result-view"
            initial={{ opacity: 0, height: 'auto' }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="space-y-8"
          >
            {/* 1. Success announcement */}
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h3
                className="font-serif text-2xl sm:text-3xl font-normal text-ink"
                aria-live="polite"
              >
                {platformContent.hideMode.successHeading}
              </h3>
            </div>

            {/* 2. Comparison Slider */}
            <div>
              <ComparisonSlider
                originalSrc={state.previewUrl}
                stegoSrc={state.stegoUrl}
                stegoBlob={state.result.stegoBlob}
                className="w-full"
              />
            </div>

            {/* 3. Key Card (32px gap above it) */}
            <KeyCard
              keyValue={state.result.key}
              saved={state.keySaved}
              onSavedChange={markKeySaved}
              onCopied={markKeyCopied}
            />

            {/* 4. Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Button
                variant="primary"
                onClick={handleDownloadImage}
                fullWidthOnMobile
                className="flex-1"
              >
                {platformContent.hideMode.downloadImage}
              </Button>

              <Button
                variant="secondary"
                onClick={handleHideAnotherClick}
                fullWidthOnMobile
                className="flex-1"
              >
                {platformContent.hideMode.hideAnother}
              </Button>
            </div>

            {/* 5. Metrics Row */}
            <MetricsRow
              psnr={state.result.metrics.psnr}
              ssim={state.result.metrics.ssim}
              usedBytes={state.result.metrics.usedBytes}
              capacityBytes={state.result.metrics.capacityBytes}
            />

            {/* 6. Sharing Note with Why link */}
            <SharingNote />
          </motion.div>
        ) : (
          /* =========================================================================
             STATES A, B, C: EMPTY / IMAGE LOADED / HIDING
             ========================================================================= */
          <motion.div
            key="input-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Dropzone / Preview */}
            <div ref={dropzoneRef} tabIndex={-1}>
              <Dropzone
                mode="hide"
                file={state.file}
                previewUrl={state.previewUrl}
                dimensions={state.dimensions}
                onFile={setFile}
                onClear={() => setFile(null)}
                error={
                  state.status === 'invalid' && state.reason === 'image_invalid'
                    ? state.validationError
                    : undefined
                }
              />
            </div>

            {/* Message Field (auto-grows 160px-320px, Figtree 18px) */}
            <div className="space-y-3">
              <MessageField
                ref={textareaRef}
                value={state.message}
                onChange={setMessage}
                disabled={!hasValidImage || isHiding}
                onKeyDown={handleTextareaKeyDown}
                textareaClassName={
                  isAnimationRunning ? 'opacity-0 transition-opacity duration-200' : ''
                }
              />

              {/* Capacity Meter: appears under MessageField once image is loaded */}
              {hasValidImage && (
                <CapacityMeter
                  used={state.usedBytes}
                  capacity={state.capacityBytes}
                  loading={state.isCapacityLoading}
                />
              )}
            </div>

            {/* Action Area: Primary Button or Progress Pill */}
            <div className="space-y-3 pt-2">
              {isHiding ? (
                <div className="space-y-2">
                  <ProgressPill label={platformContent.hideMode.hidingLabel} />
                  {/* Slow request notice (after 6s) */}
                  {state.status === 'hiding' && state.slowNotice && (
                    <p
                      role="status"
                      aria-live="polite"
                      className="text-center font-sans text-sm text-ink-soft animate-in fade-in duration-200"
                    >
                      {platformContent.hideMode.slowNotice}
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
                  {platformContent.hideMode.submitAction}
                </Button>
              )}

              {/* Error Mapping beneath Primary Button */}
              {state.status === 'error' && (
                <div className="pt-2">
                  {state.error.kind === 'over_capacity' && (
                    <InlineMessage variant="error">
                      {platformContent.capacityMeter.overCapacityCaption(
                        state.usedBytes -
                          (state.error.maxCapacityBytes ?? state.capacityBytes ?? 4096)
                      )}
                    </InlineMessage>
                  )}

                  {state.error.kind === 'invalid_input' && (
                    <InlineMessage variant="error">
                      {platformContent.hideMode.errorInvalidInput}
                    </InlineMessage>
                  )}

                  {state.error.kind === 'too_large' && (
                    <InlineMessage variant="error">
                      {platformContent.validation.tooBig(
                        Math.round((state.file?.size ?? 0) / (1024 * 1024))
                      )}
                    </InlineMessage>
                  )}

                  {state.error.kind === 'rate_limited' && (
                    <InlineMessage variant="error">
                      {platformContent.hideMode.errorRateLimited}{' '}
                      <span className="font-semibold">
                        {platformContent.hideMode.rateLimitCountdown(rateLimitSeconds)}
                      </span>
                    </InlineMessage>
                  )}

                  {state.error.kind === 'server' && (
                    <div className="space-y-3">
                      <InlineMessage variant="error">
                        {platformContent.hideMode.errorServer}
                      </InlineMessage>
                      <Button
                        variant="secondary"
                        size="nav"
                        onClick={handleSubmit}
                        className="mt-1"
                      >
                        {platformContent.hideMode.retryAction}
                      </Button>
                    </div>
                  )}

                  {(state.error.kind === 'network' || state.error.kind === 'offline') && (
                    <InlineMessage variant="offline">
                      {platformContent.hideMode.offlineBanner}
                    </InlineMessage>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Guard Confirmation Modal */}
      <Modal
        isOpen={isLeaveGuardModalOpen}
        onClose={() => setIsLeaveGuardModalOpen(false)}
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
              onClick={() => {
                setIsLeaveGuardModalOpen(false);
                pendingAction?.();
              }}
              className="text-sm font-medium"
            >
              {platformContent.leaveGuard.leaveAction}
            </TextLink>

            <Button
              variant="primary"
              onClick={() => setIsLeaveGuardModalOpen(false)}
            >
              {platformContent.leaveGuard.stayAction}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
