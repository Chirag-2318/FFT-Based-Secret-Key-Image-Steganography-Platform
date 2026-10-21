import { createContext, useContext } from 'react';

export interface ToastContextValue {
  showToast: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access the toast notification system.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
