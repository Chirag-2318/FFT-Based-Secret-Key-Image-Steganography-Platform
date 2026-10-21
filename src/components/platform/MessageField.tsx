import React, { useRef, useEffect, useId } from 'react';
import { platformContent } from '@/content/platform';

export interface MessageFieldProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onByteCountChange?: (bytes: number) => void;
  id?: string;
  className?: string;
  textareaClassName?: string;
}

/**
 * Calculates UTF-8 byte count of a string.
 */
export function countUtf8Bytes(str: string): number {
  return new TextEncoder().encode(str).length;
}

/**
 * MessageField (textarea)
 * - Auto-growing textarea between 160px and 320px, then scrolls.
 * - Figtree 18px typography.
 * - UTF-8 byte count calculation.
 * - Disabled hint when an image is not yet loaded.
 */
export const MessageField = React.forwardRef<HTMLTextAreaElement, MessageFieldProps>(
  (
    {
      value,
      onChange,
      disabled = false,
      autoFocus = false,
      onKeyDown,
      onByteCountChange,
      id: externalId,
      className = '',
      textareaClassName = '',
    },
    forwardedRef
  ) => {
    const generatedId = useId();
    const id = externalId || generatedId;
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (forwardedRef as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Expose UTF-8 byte count whenever value changes
    useEffect(() => {
      const bytes = countUtf8Bytes(value);
      onByteCountChange?.(bytes);
    }, [value, onByteCountChange]);

    // Handle auto-focus
    useEffect(() => {
      if (autoFocus && !disabled && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [autoFocus, disabled, textareaRef]);

    // Handle auto-grow
    useEffect(() => {
      const el = textareaRef.current;
      if (!el) return;

      // Reset height to calculate true scrollHeight
      el.style.height = 'auto';
      const newHeight = Math.min(320, Math.max(160, el.scrollHeight));
      el.style.height = `${newHeight}px`;
    }, [value, textareaRef]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
    };


  return (
    <div className={`w-full space-y-2 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {platformContent.messageField.label}
      </label>

      <textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        onKeyDown={onKeyDown}
        placeholder={platformContent.messageField.placeholder}
        aria-describedby={disabled ? `${id}-disabled-hint` : undefined}
        rows={4}
        className={`w-full rounded-btn border p-4 font-sans text-[18px] leading-relaxed transition-colors resize-none focus:outline-none focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3 ${
          disabled
            ? 'bg-sand-soft border-line text-ink-soft cursor-not-allowed select-none'
            : 'bg-paper border-line text-ink placeholder:text-ink-soft'
        } ${textareaClassName}`}
        style={{ minHeight: '160px', maxHeight: '320px' }}
      />

      {disabled && (
        <p id={`${id}-disabled-hint`} className="text-sm font-sans text-ink-soft px-1">
          {platformContent.messageField.disabledHint}
        </p>
      )}
    </div>
  );
});

MessageField.displayName = 'MessageField';

