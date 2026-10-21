import React, { useState, useEffect } from 'react';
import { LandscapeSvg } from './LandscapeSvg';

export interface PanelChooseProps {
  isActive: boolean;
  isStatic?: boolean;
}

const SAMPLE_TEXT = 'Meet at 6, north gate.';

/**
 * Step 1 Panel Illustration:
 * Mini dropzone with landscape preview and a compose box where text types in
 * then lifts and dissolves into the photo.
 */
export const PanelChoose: React.FC<PanelChooseProps> = ({ isActive, isStatic = false }) => {
  const [displayText, setDisplayText] = useState('');
  const [isDissolving, setIsDissolving] = useState(false);

  useEffect(() => {
    if (!isActive || isStatic) {
      setDisplayText(SAMPLE_TEXT);
      setIsDissolving(false);
      return;
    }

    let isMounted = true;
    let timeoutId: number;

    const runLoop = () => {
      // Phase 1: Typing effect (0 to 1800ms)
      setDisplayText('');
      setIsDissolving(false);

      let currentLength = 0;
      const typeInterval = setInterval(() => {
        if (!isMounted) return;
        currentLength++;
        setDisplayText(SAMPLE_TEXT.slice(0, currentLength));
        if (currentLength >= SAMPLE_TEXT.length) {
          clearInterval(typeInterval);

          // Phase 2: Hold then dissolve (at 2800ms)
          timeoutId = window.setTimeout(() => {
            if (!isMounted) return;
            setIsDissolving(true);

            // Phase 3: Reset loop after 6000ms
            timeoutId = window.setTimeout(() => {
              if (isMounted) runLoop();
            }, 3000);
          }, 1000);
        }
      }, 70);
    };

    runLoop();

    return () => {
      isMounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [isActive, isStatic]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 space-y-4 select-none">
      {/* Mini dropzone / photo preview */}
      <div className="relative w-full aspect-[4/3] rounded-card overflow-hidden border border-line shadow-none">
        <LandscapeSvg />

        {/* Floating compose box overlay */}
        <div className="absolute inset-x-4 bottom-4 bg-paper text-ink border border-line rounded-btn p-3 shadow-none">
          <div className="text-[11px] font-sans font-medium uppercase tracking-wider text-ink-soft mb-1">
            Secret message
          </div>

          <div className="font-sans text-sm text-ink h-6 flex items-center overflow-hidden">
            {isDissolving ? (
              <span className="animate-char-dissolve inline-block text-ink">
                {displayText}
              </span>
            ) : (
              <span>
                {displayText}
                {!isStatic && <span className="animate-pulse">|</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="text-xs font-sans text-ink-soft text-center">
        Photo loaded • 412 bytes available
      </div>
    </div>
  );
};
