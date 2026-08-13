'use client';

import React from 'react';
import { Phone, Video, ShieldCheck, Sparkles, X, Layers } from 'lucide-react';

interface PlaceholderModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  iconType?: 'call' | 'video' | 'stories' | 'devices' | 'e2ee';
}

export default function PlaceholderModal({
  isOpen,
  onClose,
  title,
  description,
  iconType = 'call',
}: PlaceholderModalProps) {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (iconType) {
      case 'video':
        return <Video className="h-10 w-10 text-[#2c6bed]" />;
      case 'stories':
        return <Layers className="h-10 w-10 text-[#2c6bed]" />;
      case 'e2ee':
        return <ShieldCheck className="h-10 w-10 text-[#2c6bed]" />;
      default:
        return <Phone className="h-10 w-10 text-[#2c6bed]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs font-sans">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-2xl text-slate-900">
        <div className="flex justify-end">
          <button onClick={onClose} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mx-auto my-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f0fe] border border-[#d2e3fc]">
          {renderIcon()}
        </div>

        <h3 className="mt-3 text-lg font-extrabold text-slate-900">{title}</h3>

        <div className="my-2 inline-flex items-center space-x-1.5 rounded-full bg-[#e8f0fe] border border-[#d2e3fc] px-3 py-1 text-xs font-bold text-[#1b56d8]">
          <Sparkles className="h-3.5 w-3.5 text-[#2c6bed]" />
          <span>Feature Coming Soon</span>
        </div>

        <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed">{description}</p>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-[#2c6bed] py-2.5 text-xs font-bold text-white hover:bg-[#1b56d8] shadow-sm shadow-[#2c6bed]/20"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
