import React, { useRef, useId, useState, forwardRef } from 'react';
import { ClipboardPaste, Check } from 'lucide-react';
import { platformContent } from '@/content/platform';
import {
  formatKey,
  isKeyComplete,
  verifyKeyChecksum,
  calculateCaretPosition,
  normalizeKey,
  KEY_TOTAL_CHARS,
} from '@/lib/key';
import { InlineMessage } from '@/components/ui/InlineMessage';

export interface KeyInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
}

/**
 * KeyInput (design.md 6.3 & 7.2)
 * Mono single-line input with inline paste action and live auto-formatting in groups of 4.
 * - Handles cursor position safely when hyphens are inserted/removed.
 * - Graceful clipboard paste fallback.
 * - Live validation states: neutral when empty/typing, checkmark when valid, inline error when malformed.
 * - Anti-password manager attributes and zero storage/URL persistence.
 */
export const KeyInput = forwardRef<HTMLInputElement, KeyInputProps>(
  (
    {
      value,
      onChange,
      onValidChange,
      onKeyDown,
      disabled = false,
      id: externalId,
      className = '',
    },
    forwardedRef
  ) => {
    const generatedId = useId();
    const id = externalId || generatedId;
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (forwardedRef as React.RefObject<HTMLInputElement>) || internalRef;
    const [caretToRestore, setCaretToRestore] = useState<number | null>(null);

    const normalized = normalizeKey(value);
    const isEmpty = normalized.length === 0;
    const isComplete = isKeyComplete(value);
    const isValid = isComplete && verifyKeyChecksum(value);
    const isMalformed = isComplete && !isValid;

    // Restore caret position after format update
    React.useLayoutEffect(() => {
      if (caretToRestore !== null && inputRef.current) {
        inputRef.current.setSelectionRange(caretToRestore, caretToRestore);
        setCaretToRestore(null);
      }
    }, [value, caretToRestore, inputRef]);

    // Notify parent of validity changes
    React.useEffect(() => {
      onValidChange?.(isValid);
    }, [isValid, onValidChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawVal = e.target.value;
      const cursor = e.target.selectionStart ?? rawVal.length;

      const formatted = formatKey(rawVal);
      const newCaret = calculateCaretPosition(rawVal, cursor);

      setCaretToRestore(newCaret);
      onChange(formatted);
    };

    const handlePasteClick = async () => {
      if (disabled) return;
      if (!navigator.clipboard?.readText) {
        inputRef.current?.focus();
        return;
      }

      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          const formatted = formatKey(text);
          onChange(formatted);
        }
        inputRef.current?.focus();
      } catch {
        // Permission denied or clipboard inaccessible: gracefully focus input without scary errors
        inputRef.current?.focus();
      }
    };

    return (
      <div className={`w-full space-y-2 ${className}`}>
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            id={id}
            type="text"
            name="veil-key-input"
            value={value}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder={platformContent.keyInput.placeholder}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="characters"
            data-lpignore="true"
            data-1p-ignore="true"
            aria-describedby={isMalformed ? `${id}-malformed-error` : undefined}
            aria-invalid={isMalformed ? 'true' : undefined}
            className={`h-[52px] w-full rounded-btn border bg-paper pl-4 pr-[110px] font-mono text-base tracking-wider text-ink placeholder:text-ink-soft transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3 ${
              disabled
                ? 'bg-sand-soft border-line text-ink-soft cursor-not-allowed select-none'
                : isMalformed
                  ? 'border-error'
                  : 'border-line'
            }`}
          />

          {/* Right side controls: Validation mark & Paste button */}
          <div className="absolute right-1.5 flex items-center gap-1.5">
            {isValid && (
              <div className="flex items-center text-forest pr-1" aria-hidden="true">
                <Check className="w-5 h-5 stroke-[2.5]" />
                <span className="sr-only">{platformContent.keyInput.validSrOnly}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handlePasteClick}
              disabled={disabled}
              aria-label="Paste key from clipboard"
              className={`h-[44px] px-3 rounded-[10px] text-ink text-sm font-sans font-medium inline-flex items-center gap-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-2 ${
                disabled
                  ? 'bg-sand text-ink-soft cursor-not-allowed opacity-60'
                  : 'bg-sand-soft hover:bg-sand cursor-pointer'
              }`}
            >
              <ClipboardPaste className="w-4 h-4 text-ink-soft stroke-[1.5]" aria-hidden="true" />
              <span>{platformContent.keyInput.pasteButton}</span>
            </button>
          </div>
        </div>

        {/* Inline Malformed Key Error */}
        {isMalformed && (
          <InlineMessage id={`${id}-malformed-error`} variant="error">
            {platformContent.keyInput.malformedError}
          </InlineMessage>
        )}

        {/* Incomplete helper for screen readers */}
        {!isEmpty && !isComplete && (
          <p className="sr-only" aria-live="polite">
            {`${normalized.length} of ${KEY_TOTAL_CHARS} characters entered`}
          </p>
        )}
      </div>
    );
  }
);

KeyInput.displayName = 'KeyInput';
