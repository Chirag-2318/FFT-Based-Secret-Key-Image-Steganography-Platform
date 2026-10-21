import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonSize = 'default' | 'nav';

export interface BaseButtonProps {
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size variant: default (52px height) or nav (44px height) */
  size?: ButtonSize;
  /** Expand to full width on mobile viewports (< 768px) */
  fullWidthOnMobile?: boolean;
  /** Optional icon rendered before the text */
  leadingIcon?: React.ReactNode;
  /** Optional icon rendered after the text */
  trailingIcon?: React.ReactNode;
  /** Children content (must include text; no icon-only primary buttons) */
  children: React.ReactNode;
  className?: string;
}

export type ButtonProps = BaseButtonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    as?: 'button';
  };

export type ButtonAsLinkProps = BaseButtonProps &
  Omit<LinkProps, 'children'> & {
    as: 'link';
  };

function getButtonClassName({
  variant = 'primary',
  size = 'default',
  fullWidthOnMobile = false,
  disabled = false,
  className = '',
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidthOnMobile?: boolean;
  disabled?: boolean;
  className?: string;
}): string {
  const base =
    'inline-flex items-center justify-center font-sans font-medium text-base rounded-btn select-none text-center cursor-pointer ' +
    'transition-colors duration-120 active:translate-y-[1px] active:duration-80 ' +
    'focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3';

  const heights = size === 'nav' ? 'h-[44px] min-h-[44px] px-5' : 'h-[52px] min-h-[52px] px-6';
  const width = fullWidthOnMobile ? 'w-full sm:w-auto' : '';

  let visual = '';
  if (disabled) {
    visual =
      'bg-sand text-ink-soft border border-line cursor-not-allowed pointer-events-none active:translate-y-0';
  } else if (variant === 'primary') {
    visual = 'bg-lavender text-ink border-2 border-ink hover:bg-lavender-deep';
  } else {
    // secondary
    visual = 'bg-paper text-ink border-2 border-ink hover:bg-sand-soft';
  }

  return [base, heights, width, visual, className].filter(Boolean).join(' ');
}

/**
 * Button primitive meeting Section 4.3 of design.md.
 * Uses 2px ink border with lavender or paper fill, respecting 44px min touch target.
 */
export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps | ButtonAsLinkProps
>(function Button(props, ref) {
  const {
    variant = 'primary',
    size = 'default',
    fullWidthOnMobile = false,
    leadingIcon,
    trailingIcon,
    children,
    className = '',
    ...rest
  } = props;

  const content = (
    <span className="inline-flex items-center justify-center gap-2">
      {leadingIcon && <span className="inline-flex shrink-0">{leadingIcon}</span>}
      <span>{children}</span>
      {trailingIcon && <span className="inline-flex shrink-0">{trailingIcon}</span>}
    </span>
  );

  if (props.as === 'link') {
    const linkProps = rest as Omit<ButtonAsLinkProps, 'as'>;
    const combinedClass = getButtonClassName({
      variant,
      size,
      fullWidthOnMobile,
      className,
    });
    return (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} className={combinedClass} {...linkProps}>
        {content}
      </Link>
    );
  }

  const buttonProps = rest as Omit<ButtonProps, 'as'>;
  const combinedClass = getButtonClassName({
    variant,
    size,
    fullWidthOnMobile,
    disabled: Boolean(buttonProps.disabled),
    className,
  });

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={buttonProps.type || 'button'}
      className={combinedClass}
      {...buttonProps}
    >
      {content}
    </button>
  );
});

/**
 * LinkButton helper component for router links styled as buttons.
 */
export const LinkButton = React.forwardRef<HTMLAnchorElement, Omit<ButtonAsLinkProps, 'as'>>(
  function LinkButton(props, ref) {
    return <Button ref={ref} as="link" {...props} />;
  },
);
