import React, { useState, useEffect } from 'react';
import { KeyRound } from 'lucide-react';
import { LandscapeSvg } from './LandscapeSvg';

export interface PanelShareImageProps {
  isActive: boolean;
  isStatic?: boolean;
}

const AVATARS = ['A', 'B', 'C', 'D', 'E'];

/**
 * Step 2 Panel Illustration:
 * A simple calm messaging thread with a photo bubble posted to 5 recipients (A..E),
 * where only recipient C has a key badge.
 */
export const PanelShareImage: React.FC<PanelShareImageProps> = ({
  isActive,
  isStatic = false,
}) => {
  const [showKeyBadge, setShowKeyBadge] = useState(isStatic);

  useEffect(() => {
    if (isStatic) {
      setShowKeyBadge(true);
      return;
    }

    if (!isActive) {
      setShowKeyBadge(false);
      return;
    }

    const timer = setTimeout(() => {
      setShowKeyBadge(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [isActive, isStatic]);

  return (
    <div className="w-full h-full flex flex-col justify-between p-6 select-none space-y-4">
      {/* Mock Chat Thread Container */}
      <div className="w-full flex-1 bg-cream/70 rounded-card border border-line p-5 flex flex-col justify-center space-y-4">
        {/* Chat message header */}
        <div className="flex items-center justify-between text-xs font-sans text-ink-soft border-b border-line pb-2">
          <span>Shared with group</span>
          <span>Today</span>
        </div>

        {/* Photo message bubble */}
        <div className="self-end max-w-[240px] w-full bg-paper rounded-btn p-2 border border-line shadow-none">
          <div className="w-full aspect-[4/3] rounded-[10px] overflow-hidden border border-line/60">
            <LandscapeSvg />
          </div>
          <p className="text-[11px] font-sans text-ink-soft mt-1.5 px-1">
            holiday_stego.png
          </p>
        </div>

        {/* Recipients Row */}
        <div className="pt-2">
          <div className="text-[11px] font-sans text-ink-soft mb-2">
            5 recipients have the image:
          </div>
          <div className="flex items-center gap-2.5">
            {AVATARS.map((initial) => {
              const isKeyHolder = initial === 'C';
              return (
                <div key={initial} className="relative flex flex-col items-center">
                  <div className="w-9 h-9 rounded-pill bg-sand text-ink flex items-center justify-center font-sans font-medium text-xs border border-line">
                    {initial}
                  </div>

                  {/* Key badge on recipient C */}
                  {isKeyHolder && (
                    <div
                      className={`absolute -top-1 -right-1 w-4 h-4 rounded-pill bg-forest text-cream flex items-center justify-center transition-opacity duration-300 ${
                        showKeyBadge ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                      }`}
                      title="Has the key"
                    >
                      <KeyRound className="w-2.5 h-2.5" strokeWidth={2} aria-hidden="true" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="text-xs font-sans text-ink-soft text-center">
        Everyone sees a photo • Only C holds the key
      </div>
    </div>
  );
};
