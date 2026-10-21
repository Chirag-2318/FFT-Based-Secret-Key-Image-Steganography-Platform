import React from 'react';
import { AlertCircle, Info, WifiOff } from 'lucide-react';

export type InlineMessageVariant = 'error' | 'note' | 'offline';

export interface InlineMessageProps {
  /** Visual variant: error, note, or offline */
  variant: InlineMessageVariant;
  /** Optional title or bold heading */
  title?: string;
  /** Message content */
  children: React.ReactNode;
  id?: string;
  className?: string;
}

/**
 * InlineMessage primitive meeting Section 4.9 & 6.4 of design.md.
 * Error variant uses error text color and a 1px error border (never a filled red block).
 */
export const InlineMessage: React.FC<InlineMessageProps> = ({
  variant,
  title,
  children,
  id,
  className = '',
}) => {
  if (variant === 'error') {
    return (
      <div
        id={id}
        role="alert"
        className={`flex items-start gap-2.5 p-3.5 rounded-btn border border-error bg-transparent text-error font-sans text-sm ${className}`}
      >
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} aria-hidden="true" />
        <div className="leading-snug">
          {title && <span className="font-semibold block mb-0.5">{title}</span>}
          <span>{children}</span>
        </div>
      </div>
    );
  }

  if (variant === 'offline') {
    return (
      <div
        id={id}
        role="status"
        className={`flex items-center gap-2 px-4 py-2.5 rounded-btn bg-sand text-ink border border-line font-sans text-sm ${className}`}
      >
        <WifiOff className="w-4 h-4 shrink-0 text-ink" strokeWidth={1.5} aria-hidden="true" />
        <div className="leading-snug">
          {title && <span className="font-semibold mr-1.5">{title}</span>}
          <span>{children}</span>
        </div>
      </div>
    );
  }

  // note
  return (
    <div
      id={id}
      role="note"
      className={`flex items-start gap-2.5 p-4 rounded-btn bg-sand text-ink border border-line font-sans text-sm ${className}`}
    >
      <Info
        className="w-4 h-4 shrink-0 text-ink-soft mt-0.5"
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <div className="leading-snug">
        {title && <span className="font-semibold block mb-0.5">{title}</span>}
        <span>{children}</span>
      </div>
    </div>
  );
};
