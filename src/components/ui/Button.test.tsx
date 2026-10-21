import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders primary button by default', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('bg-lavender');
    expect(btn.className).toContain('border-2');
    expect(btn.className).toContain('border-ink');
  });

  it('renders secondary button when specified', () => {
    render(<Button variant="secondary">Cancel</Button>);
    const btn = screen.getByRole('button', { name: /cancel/i });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toContain('bg-paper');
  });

  it('renders disabled state correctly', () => {
    render(<Button disabled>Disabled Action</Button>);
    const btn = screen.getByRole('button', { name: /disabled action/i });
    expect(btn).toBeDisabled();
    expect(btn.className).toContain('bg-sand');
  });
});
