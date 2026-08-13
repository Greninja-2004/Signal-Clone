'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, Bell } from 'lucide-react';
import Avatar from '@/components/ui/avatar';

export interface ToastMessage {
  id: string;
  title: string;
  content: string;
  senderName: string;
  senderAvatar?: string;
  onClick?: () => void;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((toastData: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastMessage = { ...toastData, id };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep max 4 toasts

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2.5 max-w-sm w-full pointer-events-none font-sans">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => {
              if (toast.onClick) toast.onClick();
              removeToast(toast.id);
            }}
            className="pointer-events-auto flex items-center justify-between space-x-3 rounded-2xl border border-slate-200 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 cursor-pointer hover:border-[#2c6bed]"
          >
            <div className="flex items-center space-x-3 min-w-0">
              <Avatar name={toast.senderName} url={toast.senderAvatar} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-1.5">
                  <Bell className="h-3.5 w-3.5 text-[#2c6bed]" />
                  <p className="truncate text-xs font-bold text-slate-900">{toast.title}</p>
                </div>
                <p className="truncate text-xs text-slate-600 font-medium mt-0.5">{toast.content}</p>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
