import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Headline } from './Headline';

describe('Headline', () => {
  it('renders two lines with accessible single-sentence label', () => {
    render(<Headline line1="Hide words" line2="in plain sight." size="hero" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveAttribute('aria-label', 'Hide words in plain sight.');
    expect(heading.className).toContain('t-hero');
  });

  it('renders h2 semantic level when size is h2', () => {
    render(<Headline line1="Look closely." line2="You can't tell." size="h2" />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('aria-label', "Look closely. You can't tell.");
    expect(heading.className).toContain('t-h2');
  });
});
