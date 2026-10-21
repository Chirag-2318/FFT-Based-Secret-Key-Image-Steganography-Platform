import React from 'react';
import { heroConfig } from '@/content/hero';

export interface HeroRingProps {
  isStatic?: boolean;
}

/**
 * HeroRing: A large circular SVG ring with secret fragments rotating on a textPath.
 * Features a concentric faint sand-soft guide circle.
 * Responsive: hides text on mobile (<768px) to preserve headline legibility.
 */
export const HeroRing: React.FC<HeroRingProps> = ({ isStatic = false }) => {
  const { fragments } = heroConfig.ring;

  // Combine fragments separated by generous spacing
  const fullSentence = fragments.join('              ') + '              ';

  // SVG dimensions
  const center = 500;
  const radius = 410;
  const outerRadius = radius + heroConfig.ring.concentricRadiusOffset;

  // Path data for clockwise circular text path starting at top center
  const textPathD = `M ${center},${center - radius} A ${radius},${radius} 0 1,1 ${center - 0.1},${center - radius} Z`;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden -z-10">
      <svg
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[140vw] max-w-[1300px] h-[140vw] max-h-[1300px] shrink-0"
        aria-hidden="true"
      >
        <defs>
          <path id="hero-ring-circle" d={textPathD} />
        </defs>

        {/* Faint decorative outer concentric curve (sand-soft stroke) */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          stroke="var(--sand)"
          strokeWidth="1"
          strokeDasharray="4 8"
          className="opacity-40"
        />

        {/* Inner concentric curve */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="var(--sand-soft)"
          strokeWidth="1"
          className="opacity-50"
        />

        {/* Rotating ring of secret text fragments */}
        <g
          className={`${
            isStatic ? '' : 'animate-hero-ring'
          } hidden md:block origin-center`}
        >
          <text
            className="font-sans text-[18px] tracking-wider fill-ink-soft uppercase"
            style={{ fillOpacity: 0.45 }}
          >
            <textPath href="#hero-ring-circle" startOffset="0%">
              {fullSentence}
            </textPath>
          </text>
        </g>
      </svg>
    </div>
  );
};
