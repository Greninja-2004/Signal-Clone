'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Globe, ChevronDown, ArrowRight } from 'lucide-react';

export default function LandingNavbar() {
  const [showLangModal, setShowLangModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');

  const languages = ['English', 'Español', 'Français', 'Deutsch', '日本語', 'हिन्दी', 'Português', 'Русский', '中文'];

  return (
    <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 text-slate-900 font-sans">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2c6bed] text-white shadow-sm shadow-[#2c6bed]/20">
            <MessageSquare className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Signal</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden items-center gap-7 text-sm font-medium md:flex text-slate-600">
          <a href="#features" className="hover:text-[#2c6bed] transition">Features</a>
          <a href="#privacy" className="hover:text-[#2c6bed] transition">Privacy</a>
          <a href="https://support.signal.org" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Help</a>
          <a href="https://signal.org/blog/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Blog</a>
          <a href="https://signal.org/docs/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Developers</a>
          <a href="https://signal.org/donate/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Donate</a>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLangModal(!showLangModal)}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{selectedLang}</span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showLangModal && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl text-xs z-50">
                {languages.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLang(lang);
                      setShowLangModal(false);
                    }}
                    className="block w-full rounded-lg px-3 py-1.5 text-left text-slate-800 hover:bg-slate-100 hover:text-[#2c6bed]"
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* CTA Launch Web App Button */}
        <Link
          href="/app"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2c6bed] px-4.5 py-2.5 text-xs font-semibold text-white shadow-sm shadow-[#2c6bed]/30 transition hover:bg-[#1b56d8] active:scale-[0.98]"
        >
          <span>Launch Signal Web</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </nav>
  );
}
