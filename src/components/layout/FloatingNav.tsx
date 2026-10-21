import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Logo, Button, SegmentedToggle } from '@/components/ui';
import { shellContent } from '@/content/shell';

export interface FloatingNavProps {
  activeSection?: string;
}

/**
 * Signature Floating Nav meeting Section 4.2 of design.md.
 * Overlays content 16px below the top, max-width 1140px, rounded-20px container.
 * Features mode toggle doorway on '/', live toggle on '/app', section spy highlighting,
 * and an accessible mobile sheet under <768px.
 */
export const FloatingNav: React.FC<FloatingNavProps> = ({ activeSection = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileSheetRef = useRef<HTMLDivElement>(null);

  const isPlatformPage = location.pathname.startsWith('/app');
  const isLandingPage = location.pathname === '/';

  // Current mode on /app, or unselected on /
  const currentAppMode = (searchParams.get('mode') === 'reveal' ? 'reveal' : 'hide') as
    | 'hide'
    | 'reveal';
  const toggleValue = isPlatformPage ? currentAppMode : '';

  const handleToggleChange = (val: string) => {
    if (isLandingPage) {
      navigate(`/app?mode=${val}`);
    } else {
      setSearchParams({ mode: val });
    }
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu on Esc or route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Target paths for anchor links
  const howTarget = isLandingPage ? '#how' : '/#how';
  const privacyTarget = isLandingPage ? '#privacy' : '/#privacy';
  const limitsTarget = isLandingPage ? '#limits' : '/#limits';

  const navLinks = [
    { label: shellContent.nav.howItWorks, to: howTarget, id: 'how' },
    { label: shellContent.nav.privacy, to: privacyTarget, id: 'privacy' },
    { label: shellContent.nav.limits, to: limitsTarget, id: 'limits' },
  ];

  return (
    <>
      {/* Skip to Content accessible link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-paper focus:text-ink focus:border focus:border-line focus:rounded-btn font-sans text-sm font-medium"
      >
        {shellContent.nav.skipToContent}
      </a>

      <header className="fixed top-4 left-4 right-4 z-40 max-w-[1140px] mx-auto select-none">
        <nav
          aria-label={shellContent.nav.ariaLabel}
          style={{ boxShadow: '0 1px 0 rgba(26,26,26,0.04)' }}
          className="w-full bg-paper text-ink border border-line rounded-[20px] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4"
        >
          {/* Left: Logo */}
          <div className="shrink-0 flex items-center">
            <Logo asLink glyphSize={26} />
          </div>

          {/* Center-Left: Mode Toggle */}
          <div className="flex items-center">
            <SegmentedToggle
              options={[
                { value: 'hide', label: shellContent.nav.modeHide },
                { value: 'reveal', label: shellContent.nav.modeReveal },
              ]}
              value={toggleValue}
              onChange={handleToggleChange}
              ariaLabel={shellContent.nav.chooseModeAria}
              layoutIdPrefix="nav-toggle"
            />
          </div>

          {/* Center-Right: Desktop Text Links */}
          <div className="hidden md:flex items-center gap-8 font-sans text-sm font-medium">
            {navLinks.map((link) => {
              const isActive = isLandingPage && activeSection === link.id;
              return (
                <Link
                  key={link.id}
                  to={link.to}
                  className={`transition-colors duration-120 py-1 ${
                    isActive
                      ? 'text-ink border-b-2 border-ember'
                      : 'text-ink-soft hover:text-ink border-b-2 border-transparent'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Far Right: Primary Button (Desktop) & Mobile Hamburger */}
          <div className="flex items-center gap-2">
            {!isPlatformPage && (
              <div className="hidden md:block">
                <Button as="link" to="/app" size="nav" variant="primary">
                  {shellContent.nav.openTool}
                </Button>
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={
                isMobileMenuOpen
                  ? shellContent.nav.menuCloseAria
                  : shellContent.nav.menuOpenAria
              }
              aria-expanded={isMobileMenuOpen}
              className="md:hidden p-2 text-ink rounded-btn focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3 cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
              ) : (
                <Menu className="w-6 h-6" strokeWidth={1.5} aria-hidden="true" />
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Full-width Sheet */}
        {isMobileMenuOpen && (
          <div
            ref={mobileSheetRef}
            className="md:hidden mt-2 bg-paper text-ink border border-line rounded-card p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-180"
          >
            <div className="flex flex-col space-y-4 font-sans text-base font-medium">
              {navLinks.map((link) => (
                <Link
                  key={link.id}
                  to={link.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-ink py-2 border-b border-line/40 hover:text-forest"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {!isPlatformPage && (
              <div className="pt-2">
                <Button
                  as="link"
                  to="/app"
                  variant="primary"
                  fullWidthOnMobile
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {shellContent.nav.openTool}
                </Button>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
};
