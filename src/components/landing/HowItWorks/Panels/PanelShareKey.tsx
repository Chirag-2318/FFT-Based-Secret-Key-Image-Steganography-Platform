import React from 'react';
import { KeyRound } from 'lucide-react';
import { LandscapeSvg } from './LandscapeSvg';

export interface PanelShareKeyProps {
  isActive: boolean;
  isStatic?: boolean;
}

/**
 * Step 3 Panel Illustration:
 * Two distinct separate transmission paths: the photo travels along an upper path,
 * while the mini KeyCard travels along a separate lower path to the recipient.
 */
export const PanelShareKey: React.FC<PanelShareKeyProps> = ({
  isActive,
  isStatic = false,
}) => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-6 select-none space-y-4">
      {/* Paths Visualization Container */}
      <div className="relative w-full flex-1 bg-cream/70 rounded-card border border-line p-5 flex flex-col justify-between overflow-hidden">
        {/* SVG background paths */}
        <svg
          viewBox="0 0 360 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden="true"
        >
          {/* Path A (Upper: Photo channel) */}
          <path
            d="M 60 70 C 150 20, 210 20, 300 70"
            stroke="var(--line)"
            strokeWidth="2"
            strokeDasharray="4 6"
          />

          {/* Path B (Lower: Key channel) */}
          <path
            d="M 60 150 C 150 200, 210 200, 300 150"
            stroke="var(--forest)"
            strokeWidth="2"
            strokeDasharray="4 6"
            className="opacity-70"
          />
        </svg>

        {/* Sender (Left) */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-pill bg-paper border border-line text-ink font-sans font-medium text-xs flex items-center justify-center">
            You
          </div>
          <span className="text-[11px] font-sans text-ink-soft">Separate channels</span>
        </div>

        {/* Floating Items Traveling Along the Paths */}
        <div className="relative z-10 flex flex-col justify-around h-28 my-auto">
          {/* Item 1: Traveling Photo Bubble */}
          <div
            className={`self-center bg-paper border border-line rounded-btn p-1.5 shadow-none w-28 transition-transform duration-700 ${
              isActive && !isStatic ? 'translate-x-2' : ''
            }`}
          >
            <div className="w-full h-12 rounded-[6px] overflow-hidden">
              <LandscapeSvg />
            </div>
            <div className="text-[10px] font-sans text-ink-soft text-center mt-1">
              File via email
            </div>
          </div>

          {/* Item 2: Traveling Key Card (Miniature) */}
          <div
            className={`self-center bg-sand text-ink border border-line rounded-[14px] p-2.5 shadow-none max-w-[200px] w-full transition-transform duration-700 ${
              isActive && !isStatic ? '-translate-x-2' : ''
            }`}
          >
            <div className="flex items-center gap-1.5 text-forest text-[11px] font-medium mb-1">
              <KeyRound className="w-3 h-3 shrink-0" strokeWidth={1.5} aria-hidden="true" />
              <span>Key (Signal / SMS)</span>
            </div>
            <div className="bg-paper border border-line rounded-btn px-2 py-1 font-mono text-[11px] tracking-wider text-ink text-center">
              K7QM-2VXD-...
            </div>
          </div>
        </div>

        {/* Recipient (Right) */}
        <div className="flex items-center justify-end gap-3 relative z-10">
          <span className="text-[11px] font-sans text-forest font-medium">Friend reveals message</span>
          <div className="w-10 h-10 rounded-pill bg-forest text-cream font-sans font-medium text-xs flex items-center justify-center border border-forest">
            C
          </div>
        </div>
      </div>

      <div className="text-xs font-sans text-ink-soft text-center">
        Image and key travel separately • Never together
      </div>
    </div>
  );
};
