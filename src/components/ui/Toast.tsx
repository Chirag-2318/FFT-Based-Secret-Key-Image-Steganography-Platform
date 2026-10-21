import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ToastContext } from './ToastContext';

export interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * ToastProvider primitive meeting Section 4.9 of design.md.
 * Displays a single paper pill at bottom-center for 3 seconds, fading in/out over 150ms.
 * New toasts automatically replace existing ones without stacking.
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [message, setMessage] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    setMessage(msg);
    timeoutRef.current = window.setTimeout(() => {
      setMessage(null);
      timeoutRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none flex justify-center"
        aria-live="polite"
        role="status"
      >
        <AnimatePresence mode="wait">
          {message && (
            <motion.div
              key={message}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="pointer-events-auto bg-paper text-ink border border-line rounded-pill px-5 py-2.5 text-sm font-sans font-medium text-center max-w-sm whitespace-nowrap"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
