import React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BaseTextLinkProps {
  /** Optional trailing chevron for learn-more links */
  withChevron?: boolean;
  /** Children content */
  children: React.ReactNode;
  className?: string;
}

export type TextLinkAsLinkProps = BaseTextLinkProps &
  LinkProps & {
    as?: 'link';
  };

export type TextLinkAsAnchorProps = BaseTextLinkProps &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as: 'a';
    href: string;
  };

export type TextLinkAsButtonProps = BaseTextLinkProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    as: 'button';
  };

export type TextLinkProps = TextLinkAsLinkProps | TextLinkAsAnchorProps | TextLinkAsButtonProps;

/**
 * TextLink primitive: inline link with 500 weight, hover underline, and optional Lucide chevron.
 * Has an expanded touch target (min 44px) for accessibility.
 */
export const TextLink = React.forwardRef<
  HTMLAnchorElement | HTMLButtonElement,
  TextLinkProps
>(function TextLink(props, ref) {
  const { withChevron = false, children, className = '' } = props;

  const baseClasses =
    'inline-flex items-center gap-1 font-sans font-medium text-ink hover:underline ' +
    'min-h-[44px] py-2 cursor-pointer select-none ' +
    'focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3';

  const combinedClass = [baseClasses, className].filter(Boolean).join(' ');

  const content = (
    <>
      <span>{children}</span>
      {withChevron && (
        <ChevronRight
          className="w-4 h-4 text-ink inline-block shrink-0 transition-transform duration-120 group-hover:translate-x-0.5"
          strokeWidth={1.5}
          aria-hidden="true"
        />
      )}
    </>
  );

  if (props.as === 'a') {
    const anchorProps = { ...props };
    delete (anchorProps as { as?: unknown }).as;
    delete (anchorProps as { withChevron?: unknown }).withChevron;
    delete (anchorProps as { className?: unknown }).className;
    delete (anchorProps as { children?: unknown }).children;

    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        className={combinedClass}
        {...(anchorProps as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {content}
      </a>
    );
  }

  if (props.as === 'button') {
    const buttonProps = { ...props };
    delete (buttonProps as { as?: unknown }).as;
    delete (buttonProps as { withChevron?: unknown }).withChevron;
    delete (buttonProps as { className?: unknown }).className;
    delete (buttonProps as { children?: unknown }).children;

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={props.type || 'button'}
        className={combinedClass}
        {...(buttonProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </button>
    );
  }

  const linkProps = { ...props };
  delete (linkProps as { as?: unknown }).as;
  delete (linkProps as { withChevron?: unknown }).withChevron;
  delete (linkProps as { className?: unknown }).className;
  delete (linkProps as { children?: unknown }).children;

  return (
    <Link
      ref={ref as React.Ref<HTMLAnchorElement>}
      className={combinedClass}
      {...(linkProps as unknown as LinkProps)}
    >
      {content}
    </Link>
  );
});
