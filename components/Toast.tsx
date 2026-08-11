'use client';

import React, { createContext, useContext } from 'react';
import { Toaster, toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (title: string, type?: ToastType, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showToast = (title: string, type: ToastType = 'info', description?: string) => {
    const options = description ? { description } : undefined;
    if (type === 'success') {
      toast.success(title, options);
    } else if (type === 'error') {
      toast.error(title, options);
    } else {
      toast.info(title, options);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster
        position="top-right"
        theme="dark"
        richColors
        toastOptions={{
          style: {
            background: '#0d1310',
            border: '1px solid #213028',
            color: '#eaf2ec',
          },
        }}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
