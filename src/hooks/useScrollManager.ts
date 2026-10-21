import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Handles smooth scrolling to top on route change,
 * hash anchor scrolling accounting for sticky/floating navigation,
 * and tracks the currently visible section on the Landing page for scroll-spy highlighting.
 */
export function useScrollManager() {
  const { pathname, hash } = useLocation();
  const [activeSection, setActiveSection] = useState<string>('');

  // Handle route and hash scrolling
  useEffect(() => {
    if (hash) {
      const targetId = hash.replace(/^#/, '');
      // Slight delay to allow DOM to render if navigating from another route
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  // Track active section for scroll-spy on landing page
  useEffect(() => {
    if (pathname !== '/') {
      setActiveSection('');
      return;
    }

    const sectionIds = ['how', 'privacy', 'limits'];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find visible sections
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by top position to pick the most relevant one
          visibleEntries.sort(
            (a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top),
          );
          const topEntry = visibleEntries[0];
          if (topEntry) {
            setActiveSection(topEntry.target.id);
          }
        }
      },
      {
        rootMargin: '-20% 0px -50% 0px',
        threshold: [0, 0.2, 0.5],
      },
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [pathname]);

  return { activeSection };
}
