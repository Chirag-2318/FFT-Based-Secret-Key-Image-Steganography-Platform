import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SegmentedToggle } from './SegmentedToggle';

describe('SegmentedToggle', () => {
  const options = [
    { value: 'hide', label: 'Hide' },
    { value: 'reveal', label: 'Reveal' },
  ];

  it('renders radiogroup with options and checked state', () => {
    const handleChange = vi.fn();
    render(
      <SegmentedToggle
        options={options}
        value="hide"
        onChange={handleChange}
        ariaLabel="Mode toggle"
      />,
    );

    const group = screen.getByRole('radiogroup', { name: /mode toggle/i });
    expect(group).toBeInTheDocument();

    const hideRadio = screen.getByRole('radio', { name: 'Hide' });
    const revealRadio = screen.getByRole('radio', { name: 'Reveal' });

    expect(hideRadio).toHaveAttribute('aria-checked', 'true');
    expect(revealRadio).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(revealRadio);
    expect(handleChange).toHaveBeenCalledWith('reveal');
  });

  it('supports arrow key navigation', () => {
    const handleChange = vi.fn();
    render(
      <SegmentedToggle
        options={options}
        value="hide"
        onChange={handleChange}
        ariaLabel="Mode toggle"
      />,
    );

    const hideRadio = screen.getByRole('radio', { name: 'Hide' });
    fireEvent.keyDown(hideRadio, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith('reveal');
  });
});
