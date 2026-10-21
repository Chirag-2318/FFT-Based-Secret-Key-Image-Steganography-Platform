import React from 'react';

export type HeadlineSize = 'hero' | 'h1' | 'h2' | 'h3';
export type HeadlineAlign = 'left' | 'center' | 'right';

export interface HeadlineProps {
  /** Line one: upright serif */
  line1: string;
  /** Line two: italic serif, representing a complete phrase */
  line2: string;
  /** Typography scale tier */
  size?: HeadlineSize;
  /** Text alignment */
  align?: HeadlineAlign;
  /** Semantic HTML element override */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'div';
  className?: string;
}

const sizeClassMap: Record<HeadlineSize, string> = {
  hero: 't-hero',
  h1: 't-h1',
  h2: 't-h2',
  h3: 't-h3',
};

const defaultTagMap: Record<HeadlineSize, 'h1' | 'h2' | 'h3'> = {
  hero: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
};

const alignClassMap: Record<HeadlineAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * Headline primitive following Section 3.2 of design.md.
 * Renders two lines: line 1 upright serif, line 2 italic serif as a complete phrase.
 * Screen readers read it as a single coherent sentence via aria-label.
 */
export const Headline: React.FC<HeadlineProps> = ({
  line1,
  line2,
  size = 'h1',
  align = 'left',
  as,
  className = '',
}) => {
  const Component = as || defaultTagMap[size];
  const sizeClass = sizeClassMap[size];
  const alignClass = alignClassMap[align];

  const fullText = `${line1} ${line2}`;

  return (
    <Component
      className={`${sizeClass} ${alignClass} text-ink m-0 p-0 font-serif font-normal ${className}`}
      aria-label={fullText}
    >
      <span className="block" aria-hidden="true">
        {line1}
      </span>
      <span className="block italic" aria-hidden="true">
        {line2}
      </span>
    </Component>
  );
};
