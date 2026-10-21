import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

export interface ModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback fired when the modal should close */
  onClose: () => void;
  /** Accessible title for screen readers */
  title: string;
  /** Optional subtitle or description */
  description?: string;
  /** Dialog content */
  children: React.ReactNode;
  className?: string;
}

/**
 * Modal primitive meeting Section 7.4 of design.md.
 * Centered paper dialog (max-width 520px, radius 24px), dark scrim rgba(26,26,26,0.4).
 * Enforces focus trapping, body scroll lock, Escape/backdrop dismissal, and trigger focus return.
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = '',
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus restoration & body scroll lock
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Focus first focusable element inside modal
      requestAnimationFrame(() => {
        if (dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          );
          if (focusable[0]) {
            focusable[0].focus();
          } else {
            dialogRef.current.focus();
          }
        }
      });

      return () => {
        document.body.style.overflow = originalOverflow;
        previousActiveElementRef.current?.focus();
      };
    }
  }, [isOpen]);

  // Keyboard navigation: Escape key & Focus trapping
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }

    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement && lastElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement && firstElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40"
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
          role="presentation"
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="veil-modal-title"
            aria-describedby={description ? 'veil-modal-desc' : undefined}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`w-full max-w-[520px] bg-paper text-ink rounded-card p-6 sm:p-8 border border-line focus-visible:outline-none ${className}`}
          >
            <h2 id="veil-modal-title" className="sr-only">
              {title}
            </h2>
            {description && (
              <p id="veil-modal-desc" className="sr-only">
                {description}
              </p>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
