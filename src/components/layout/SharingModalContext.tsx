import React, { createContext, useContext, useState, useCallback } from 'react';

export interface SharingModalContextValue {
  isOpen: boolean;
  openSharingModal: () => void;
  closeSharingModal: () => void;
}

const SharingModalContext = createContext<SharingModalContextValue | null>(null);

export function useSharingModal(): SharingModalContextValue {
  const context = useContext(SharingModalContext);
  if (!context) {
    throw new Error('useSharingModal must be used within a SharingModalProvider');
  }
  return context;
}

export interface SharingModalProviderProps {
  children: React.ReactNode;
}

export const SharingModalProvider: React.FC<SharingModalProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openSharingModal = useCallback(() => setIsOpen(true), []);
  const closeSharingModal = useCallback(() => setIsOpen(false), []);

  return (
    <SharingModalContext.Provider value={{ isOpen, openSharingModal, closeSharingModal }}>
      {children}
    </SharingModalContext.Provider>
  );
};
