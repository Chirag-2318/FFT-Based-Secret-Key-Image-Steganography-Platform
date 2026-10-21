import React from 'react';

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'onToggle'> {
  /** Pressed state for toggle behavior */
  pressed?: boolean;
  /** Callback fired on toggle */
  onToggle?: (pressed: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Chip primitive: pill-shaped toggle button with 1px line border and paper fill.
 * Supports aria-pressed for interactive state toggling (e.g., "Show the difference").
 */
export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(function Chip(
  { pressed = false, onToggle, onClick, children, className = '', ...rest },
  ref,
) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    onToggle?.(!pressed);
  };

  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={pressed}
      onClick={handleClick}
      className={`inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-pill border font-sans text-sm font-medium transition-colors duration-120 cursor-pointer select-none ${
        pressed
          ? 'bg-sand-soft border-ink text-ink'
          : 'bg-paper border-line text-ink hover:bg-cream'
      } focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3 ${className}`}
      {...rest}
    >
      <span
        className={`w-2 h-2 rounded-pill transition-colors duration-120 ${
          pressed ? 'bg-ember' : 'bg-line'
        }`}
        aria-hidden="true"
      />
      <span>{children}</span>
    </button>
  );
});
