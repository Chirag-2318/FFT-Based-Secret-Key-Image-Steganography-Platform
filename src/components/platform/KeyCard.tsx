import React, { useState, useId } from 'react';
import { Check, Copy } from 'lucide-react';
import { platformContent } from '@/content/platform';
import { formatKey, formatKeyForSpeech } from '@/lib/key';
import { Button } from '@/components/ui/Button';
import { TextLink } from '@/components/ui/TextLink';
import { useToast } from '@/components/ui/ToastContext';

export interface KeyCardProps {
  keyValue: string;
  onCopied?: () => void;
  onSavedChange?: (saved: boolean) => void;
  saved?: boolean;
  className?: string;
  id?: string;
}

/**
 * Copies text using modern clipboard API with legacy execCommand fallback.
 * Strictly adheres to zero-persistence and no-console-logging rules.
 */
async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';
  textArea.setAttribute('readonly', '');
  textArea.setAttribute('aria-hidden', 'true');
  document.body.appendChild(textArea);
  textArea.select();

  let success = false;
  try {
    success = document.execCommand('copy');
  } catch {
    success = false;
  }
  document.body.removeChild(textArea);
  return success;
}

/**
 * KeyCard (design.md 7.2)
 * The most critical security element on the result view.
 * Features:
 * - Sand background with 24px radius and 32px padding.
 * - JetBrains Mono 22px grouped key in white field.
 * - Screen-reader aria-label with paced character pronunciation.
 * - Copy with 2s state swap, toast, and live region announcement.
 * - Text download (.txt) containing strictly key and newline.
 * - 44px hit-area accessible confirmation checkbox.
 */
export const KeyCard: React.FC<KeyCardProps> = ({
  keyValue,
  onCopied,
  onSavedChange,
  saved = false,
  className = '',
  id: externalId,
}) => {
  const generatedId = useId();
  const id = externalId || generatedId;
  const { showToast } = useToast();

  const [isCopied, setIsCopied] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const formattedKey = formatKey(keyValue);
  const speechAriaLabel = formatKeyForSpeech(formattedKey);

  const handleCopy = async () => {
    const success = await copyToClipboard(formattedKey || keyValue);
    if (success) {
      setIsCopied(true);
      setAnnouncement(platformContent.keyCard.keyCopiedAnnouncement);
      showToast(platformContent.keyCard.keyCopiedAnnouncement);
      onCopied?.();

      setTimeout(() => {
        setIsCopied(false);
        setAnnouncement('');
      }, 2000);
    }
  };

  const handleDownload = () => {
    // Only the key and a newline, no metadata or logging
    const blob = new Blob([formattedKey + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'veil-key.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const checkboxId = `${id}-saved-checkbox`;

  return (
    <div
      id={id}
      className={`bg-sand rounded-card p-5 sm:p-8 mt-8 space-y-6 ${className}`}
      aria-labelledby={`${id}-heading`}
    >
      {/* Live announcement region for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>

      {/* Heading: two lines, line 2 italic */}
      <h3 id={`${id}-heading`} className="font-serif text-[32px] leading-tight font-normal text-ink">
        {platformContent.keyCard.headingLine1}
        <span className="italic block">{platformContent.keyCard.headingLine2}</span>
      </h3>

      {/* White Key Field */}
      <div className="bg-paper rounded-btn border border-line p-5">
        <output
          aria-label={speechAriaLabel}
          className="block font-mono text-[22px] tracking-widest text-ink select-all break-all leading-relaxed"
        >
          {formattedKey}
        </output>
      </div>

      {/* Action Buttons: Copy key & Download as text */}
      <div className="flex flex-wrap items-center gap-4">
        <Button
          variant="secondary"
          onClick={handleCopy}
          leadingIcon={
            isCopied ? (
              <Check className="w-4 h-4 text-forest stroke-[2]" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4 text-ink stroke-[1.5]" aria-hidden="true" />
            )
          }
          className="min-w-[140px]"
        >
          {isCopied ? platformContent.keyCard.copied : platformContent.keyCard.copyKey}
        </Button>

        <TextLink as="button" onClick={handleDownload} className="text-sm font-medium">
          {platformContent.keyCard.downloadAsText}
        </TextLink>
      </div>

      {/* Checkbox Row: 44px min hit area with 24px visual checkbox */}
      <div className="pt-2">
        <label
          htmlFor={checkboxId}
          className="min-h-[44px] inline-flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="relative flex items-center justify-center">
            <input
              type="checkbox"
              id={checkboxId}
              checked={saved}
              onChange={(e) => onSavedChange?.(e.target.checked)}
              className="peer sr-only"
            />
            {/* 24px visual box */}
            <div className="w-6 h-6 rounded-[6px] border border-line bg-paper flex items-center justify-center peer-checked:bg-paper peer-checked:border-forest peer-focus-visible:outline-2 peer-focus-visible:outline-forest peer-focus-visible:outline-offset-3 transition-colors">
              {saved && <Check className="w-4 h-4 text-forest stroke-[2.5]" aria-hidden="true" />}
            </div>
          </div>
          <span className="font-sans text-base font-medium text-ink group-hover:text-ink/80 transition-colors">
            {platformContent.keyCard.savedCheckbox}
          </span>
        </label>
      </div>

      {/* Warning Line */}
      <p className="text-sm font-sans text-ink-soft pt-1">
        {platformContent.keyCard.warning}
      </p>
    </div>
  );
};
