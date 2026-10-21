import React, { useRef, useId } from 'react';
import { motion } from 'framer-motion';

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedToggleProps<T extends string> {
  /** List of options to toggle between */
  options: ToggleOption<T>[];
  /** Current selected value */
  value: T;
  /** Callback fired when an option is selected */
  onChange: (value: T) => void;
  /** Accessible label for the radiogroup */
  ariaLabel?: string;
  /** Unique layoutId prefix for Framer Motion animation */
  layoutIdPrefix?: string;
  className?: string;
}

/**
 * SegmentedToggle primitive meeting Section 4.5 of design.md.
 * Sand pill track with 4px padding, sliding paper active segment with 1px line border (200ms ease-out).
 * Fully accessible as a radiogroup with keyboard arrow navigation.
 */
export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = 'Mode selection',
  layoutIdPrefix,
  className = '',
}: SegmentedToggleProps<T>) {
  const autoId = useId();
  const animLayoutId = layoutIdPrefix || `toggle-active-${autoId}`;
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % options.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    } else {
      return;
    }

    const nextOption = options[nextIndex];
    if (nextOption) {
      onChange(nextOption.value);
      buttonsRef.current[nextIndex]?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center bg-sand p-1 rounded-pill select-none relative ${className}`}
    >
      {options.map((option, index) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttonsRef.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`relative z-10 inline-flex items-center justify-center min-h-[44px] px-5 py-2 font-sans text-base font-medium rounded-pill transition-colors duration-120 cursor-pointer ${
              isSelected ? 'text-ink font-semibold' : 'text-ink-soft hover:text-ink'
            } focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3`}
          >
            {isSelected && (
              <motion.span
                layoutId={animLayoutId}
                transition={{
                  duration: 0.2,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute inset-0 bg-paper rounded-pill border border-line -z-10"
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
