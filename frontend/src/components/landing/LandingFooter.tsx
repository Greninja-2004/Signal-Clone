'use client';

import React from 'react';
import Link from 'next/link';

export default function LandingFooter() {
  return (
    <footer className="bg-[#f8f9fa] py-12 text-xs text-slate-500 font-sans border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="md:col-span-2 space-y-2">
            <p className="text-sm font-bold text-slate-900">© 2013–2026 Signal Technology Foundation</p>
            <p className="text-xs leading-relaxed text-slate-500">
              &quot;Signal&quot;, Signal logos, and other trademarks are trademarks or registered trademarks of Signal Technology Foundation in the United States and other countries.
            </p>
            <p className="text-xs text-slate-500">
              Signal is an independent 501(c)(3) non-profit organization.
            </p>
          </div>

          <div>
            <p className="font-bold text-slate-900 mb-2">Organization</p>
            <ul className="space-y-1.5 text-xs">
              <li><a href="https://signal.org/donate/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Donate</a></li>
              <li><a href="https://signal.org/workworkwork/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Careers</a></li>
              <li><a href="https://signal.org/blog/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Blog</a></li>
              <li><a href="https://signal.org/legal/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Terms & Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-slate-900 mb-2">Download</p>
            <ul className="space-y-1.5 text-xs">
              <li><Link href="/app" className="hover:text-[#2c6bed] transition font-semibold">Signal Web App</Link></li>
              <li><a href="https://signal.org/download/android/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Android</a></li>
              <li><a href="https://signal.org/download/ios/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">iPhone & iPad</a></li>
              <li><a href="https://signal.org/download/windows/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Windows</a></li>
              <li><a href="https://signal.org/download/macos/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Mac</a></li>
            </ul>
          </div>

          <div>
            <p className="font-bold text-slate-900 mb-2">Help & Community</p>
            <ul className="space-y-1.5 text-xs">
              <li><a href="https://support.signal.org" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Support Center</a></li>
              <li><a href="https://community.signalusers.org/" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">Community Forum</a></li>
              <li><a href="https://github.com/signalapp" target="_blank" rel="noreferrer" className="hover:text-[#2c6bed] transition">GitHub</a></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
