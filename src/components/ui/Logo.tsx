import React from 'react';
import { Link } from 'react-router-dom';

export interface LogoGlyphProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * LogoGlyph: three vertical bars of different heights where the right-most bar
 * breaks into a small grid of discrete pixels. Uses currentColor for universal styling.
 */
export const LogoGlyph: React.FC<LogoGlyphProps> = ({ size = 24, className = '', ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
      {...props}
    >
      {/* Left bar: mid-height */}
      <rect x="2.5" y="7" width="3.5" height="13" rx="1.5" fill="currentColor" />

      {/* Middle bar: tall */}
      <rect x="8.5" y="3" width="3.5" height="17" rx="1.5" fill="currentColor" />

      {/* Right-most bar: breaking into pixels */}
      <rect x="14.5" y="3" width="2.2" height="2.2" rx="0.5" fill="currentColor" />
      <rect x="17.8" y="4" width="2.2" height="2.2" rx="0.5" fill="currentColor" />
      <rect x="14.5" y="6.6" width="2.2" height="2.2" rx="0.5" fill="currentColor" />
      <rect x="17.8" y="7.6" width="2.2" height="2.2" rx="0.5" fill="currentColor" />
      <rect x="14.5" y="10.2" width="2.2" height="2.2" rx="0.5" fill="currentColor" />
      <rect x="14.5" y="13.5" width="4.5" height="6.5" rx="1.5" fill="currentColor" />
    </svg>
  );
};

export interface LogoProps {
  /** Size of the glyph in pixels */
  glyphSize?: number;
  /** Whether clicking the logo links to home (/) */
  asLink?: boolean;
  className?: string;
}

/**
 * Logo primitive: combines the LogoGlyph with the "Veil" wordmark in Figtree 600.
 */
export const Logo: React.FC<LogoProps> = ({ glyphSize = 24, asLink = false, className = '' }) => {
  const content = (
    <span className={`inline-flex items-center gap-2.5 text-ink select-none ${className}`}>
      <LogoGlyph size={glyphSize} className="text-ink" />
      <span className="font-sans font-semibold text-xl tracking-tight text-ink">Veil</span>
    </span>
  );

  if (asLink) {
    return (
      <Link
        to="/"
        className="inline-flex items-center rounded-btn focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3"
        aria-label="Veil home"
      >
        {content}
      </Link>
    );
  }

  return content;
};
