import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { TextLink } from '@/components/ui';
import { useSharingModal } from './SharingModalContext';
import { shellContent } from '@/content/shell';

/**
 * Floating Action Button meeting Section 4.4 of design.md.
 * 56px circle, lavender fill, 2px ink border, fixed bottom-left.
 * On '/' opens popover routing to /app?mode=reveal.
 * On '/app' opens the safe sharing guidance modal.
 */
export const FloatingActionButton: React.FC = () => {
  const location = useLocation();
  const { openSharingModal } = useSharingModal();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPlatformPage = location.pathname.startsWith('/app');

  const handleClick = () => {
    if (isPlatformPage) {
      openSharingModal();
    } else {
      setIsPopoverOpen((prev) => !prev);
    }
  };

  // Close popover on Escape or outside click
  useEffect(() => {
    if (!isPopoverOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPopoverOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsPopoverOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPopoverOpen]);

  // Close popover when route changes
  useEffect(() => {
    setIsPopoverOpen(false);
  }, [location.pathname]);

  return (
    <div ref={containerRef} className="fixed bottom-6 left-6 z-40 select-none">
      {/* Popover on landing page */}
      {!isPlatformPage && isPopoverOpen && (
        <div
          role="dialog"
          aria-label={shellContent.fab.popoverPrompt}
          className="absolute bottom-16 left-0 mb-2 w-64 bg-paper text-ink border border-line rounded-[20px] p-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <p className="font-sans text-sm text-ink-soft mb-2">
            {shellContent.fab.popoverPrompt}
          </p>
          <TextLink
            to="/app?mode=reveal"
            withChevron
            onClick={() => setIsPopoverOpen(false)}
            className="text-base font-medium"
          >
            {shellContent.fab.popoverAction}
          </TextLink>
        </div>
      )}

      {/* 56px Lavender Action Button */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={
          isPlatformPage
            ? shellContent.sharingModal.title
            : shellContent.fab.ariaLabel
        }
        aria-haspopup={!isPlatformPage ? 'dialog' : undefined}
        aria-expanded={!isPlatformPage ? isPopoverOpen : undefined}
        className="w-14 h-14 rounded-pill bg-lavender hover:bg-lavender-deep border-2 border-ink flex items-center justify-center text-ink cursor-pointer active:translate-y-[1px] transition-colors duration-120 focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3"
      >
        <KeyRound className="w-6 h-6 text-ink" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
};
