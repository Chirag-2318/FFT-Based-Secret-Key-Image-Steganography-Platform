import React from 'react';

/**
 * LandscapeSvg: Tasteful, original flat-color SVG landscape illustration
 * rendered purely using design system tokens (cream, sand, forest, ember, lavender).
 */
export const LandscapeSvg: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg
      viewBox="0 0 400 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full object-cover select-none ${className}`}
      aria-hidden="true"
    >
      {/* Sky background */}
      <rect width="400" height="280" fill="var(--cream)" />

      {/* Sun / Ember warm circle */}
      <circle cx="280" cy="80" r="32" fill="var(--ember)" fillOpacity="0.8" />

      {/* Distant soft mountain (lavender) */}
      <path
        d="M60 280 L180 120 L270 280 Z"
        fill="var(--lavender)"
        fillOpacity="0.85"
      />

      {/* Mid mountain (sand) */}
      <path
        d="M170 280 L290 140 L380 280 Z"
        fill="var(--sand)"
      />

      {/* Foreground rolling hill (forest) */}
      <path
        d="M-20 280 C60 200 150 210 240 240 C310 260 360 250 420 280 Z"
        fill="var(--forest)"
      />

      {/* Faint cloud shapes */}
      <ellipse cx="120" cy="70" rx="36" ry="10" fill="var(--paper)" fillOpacity="0.8" />
      <ellipse cx="140" cy="65" rx="24" ry="12" fill="var(--paper)" fillOpacity="0.9" />
    </svg>
  );
};
