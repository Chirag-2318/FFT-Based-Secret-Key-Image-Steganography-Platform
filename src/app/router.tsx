import React, { Suspense, lazy } from 'react';
import { useLocation, useOutlet, createBrowserRouter } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from '@/components/layout';

const LandingPage = lazy(() =>
  import('@/pages/Landing').then((m) => ({ default: m.LandingPage }))
);
const PlatformPage = lazy(() =>
  import('@/pages/Platform').then((m) => ({ default: m.PlatformPage }))
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFound').then((m) => ({ default: m.NotFoundPage }))
);
const KitPage = lazy(() =>
  import('@/pages/Kit').then((m) => ({ default: m.KitPage }))
);

/**
 * RootLayout: provides the AppShell and handles 200ms opacity cross-fade
 * on route navigation.
 */
export const RootLayout: React.FC = () => {
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <AppShell>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="w-full flex-1"
        >
          <Suspense fallback={null}>
            {outlet}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </AppShell>
  );
};

/**
 * Calm error boundary element per design principles.
 */
const RouteErrorBoundary: React.FC = () => {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-6 text-center">
      <h1 className="font-serif text-3xl md:text-4xl text-ink font-normal mb-3">
        Something went wrong.
      </h1>
      <p className="font-sans text-ink-soft text-base max-w-md mb-8">
        We encountered an unexpected error. Your files and keys were never saved.
      </p>
      <a
        href="/"
        className="inline-flex items-center justify-center px-6 py-3 rounded-btn bg-forest text-cream font-sans font-medium text-sm transition-colors hover:bg-forest/90 focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-3"
      >
        Return to home
      </a>
    </div>
  );
};

/**
 * Data router configuration enabling useBlocker navigation guards.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'app', element: <PlatformPage /> },
      ...(import.meta.env.DEV ? [{ path: '_kit', element: <KitPage /> }] : []),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

