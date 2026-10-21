import React from 'react';

export interface DecorativeBackdropProps {
  className?: string;
}

/**
 * DecorativeBackdrop (design.md 6.1)
 * Faint sand-soft curved shapes (large circles/arcs as SVG, zero gradients)
 * behind the platform card on large screens (>= 1280px).
 * Purely decorative: aria-hidden="true", pointer-events-none.
 */
export const DecorativeBackdrop: React.FC<DecorativeBackdropProps> = ({
  className = '',
}) => {
  return (
    <div
      aria-hidden="true"
      className={`hidden xl:block absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}
    >
      <svg
        className="w-full h-full text-sand-soft"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Subtle, large curved arcs - no gradients */}
        <circle
          cx="180"
          cy="420"
          r="480"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.45"
        />
        <circle
          cx="1260"
          cy="480"
          r="540"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.35"
        />
        <circle
          cx="720"
          cy="920"
          r="680"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.25"
        />
      </svg>
    </div>
  );
};
