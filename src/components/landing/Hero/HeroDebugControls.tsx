import React, { useState, useEffect } from 'react';

export interface HeroDebugControlsProps {
  isPaused: boolean;
  isStatic: boolean;
  onTogglePause: () => void;
  onToggleStatic: () => void;
}

/**
 * Dev-only debug toolbar for the Hero animation.
 * Visible exclusively when `?debug` is present in the URL query string.
 */
export const HeroDebugControls: React.FC<HeroDebugControlsProps> = ({
  isPaused,
  isStatic,
  onTogglePause,
  onToggleStatic,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasDebug = window.location.search.includes('debug');
      setIsVisible(hasDebug);
    }
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      aria-label="Hero Debug Controls"
      className="fixed bottom-6 right-6 z-50 bg-paper text-ink border border-line rounded-card p-3 font-sans text-xs flex flex-col gap-2"
    >
      <div className="font-semibold text-ink-soft uppercase tracking-wider text-[10px]">
        Hero Animation Debug
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onTogglePause}
          className={`px-3 py-1.5 rounded-btn border text-xs font-medium cursor-pointer ${
            isPaused
              ? 'bg-ember text-paper border-ember'
              : 'bg-sand text-ink border-line hover:bg-sand-soft'
          }`}
        >
          {isPaused ? 'Resume Animation' : 'Pause Animation'}
        </button>
        <button
          type="button"
          onClick={onToggleStatic}
          className={`px-3 py-1.5 rounded-btn border text-xs font-medium cursor-pointer ${
            isStatic
              ? 'bg-ember text-paper border-ember'
              : 'bg-sand text-ink border-line hover:bg-sand-soft'
          }`}
        >
          {isStatic ? 'Static Frame: ON' : 'Force Static Frame'}
        </button>
      </div>
    </aside>
  );
};
