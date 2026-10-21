import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import { shellContent } from '@/content/shell';

/**
 * Announcement bar meeting Section 4.1 of design.md.
 * Non-sticky, full-width forest banner with cream text and in-memory dismissal.
 */
export const AnnouncementBar: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const location = useLocation();

  if (isDismissed) {
    return null;
  }

  // If already on landing page, link directly to #privacy anchor, else /#privacy
  const privacyTarget = location.pathname === '/' ? '#privacy' : '/#privacy';

  return (
    <aside
      aria-label="Announcement"
      className="relative z-30 w-full bg-forest text-cream py-2.5 px-4 text-center font-sans text-sm font-medium"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 pr-8 sm:pr-0">
        <span>{shellContent.announcement.message}</span>
        <Link
          to={privacyTarget}
          className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:opacity-90 rounded-btn focus-visible:outline-2 focus-visible:outline-cream focus-visible:outline-offset-2"
        >
          <span>{shellContent.announcement.linkText}</span>
          <ChevronRight className="w-3.5 h-3.5 inline-block shrink-0" strokeWidth={1.5} aria-hidden="true" />
        </Link>
      </div>

      <button
        type="button"
        onClick={() => setIsDismissed(true)}
        aria-label={shellContent.announcement.dismissAria}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-cream/80 hover:text-cream rounded-btn cursor-pointer focus-visible:outline-2 focus-visible:outline-cream focus-visible:outline-offset-2"
      >
        <X className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
      </button>
    </aside>
  );
};
