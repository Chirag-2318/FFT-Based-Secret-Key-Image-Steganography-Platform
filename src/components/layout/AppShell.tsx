import React from 'react';
import { AnnouncementBar } from './AnnouncementBar';
import { FloatingNav } from './FloatingNav';
import { FloatingActionButton } from './FloatingActionButton';
import { SharingModal } from './SharingModal';
import { SharingModalProvider } from './SharingModalContext';
import { useScrollManager } from '@/hooks/useScrollManager';

export interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell: global layout wrapper containing the AnnouncementBar, FloatingNav,
 * FloatingActionButton, and SharingModalProvider.
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { activeSection } = useScrollManager();

  return (
    <SharingModalProvider>
      <div className="min-h-screen bg-cream text-ink relative flex flex-col font-sans selection:bg-lavender selection:text-ink">
        {/* Announcement Bar */}
        <AnnouncementBar />

        {/* Floating Nav */}
        <FloatingNav activeSection={activeSection} />

        {/* Main Content Landmark */}
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none pb-20 sm:pb-0">
          {children}
        </main>

        {/* Floating Action Button (Fixed Bottom-Left) */}
        <FloatingActionButton />

        {/* Global Sharing Modal */}
        <SharingModal />
      </div>
    </SharingModalProvider>
  );
};
