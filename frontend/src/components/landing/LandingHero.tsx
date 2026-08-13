'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, MessageSquare, ArrowRight, Lock } from 'lucide-react';

export default function LandingHero() {
  return (
    <section className="overflow-hidden bg-white py-16 md:py-24 border-b border-slate-200 text-slate-900 font-sans">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 md:grid-cols-2">
        {/* Left Column: Headlines & Call-to-actions */}
        <div className="max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#e8f0fe] border border-[#d2e3fc] px-4 py-1.5 text-xs font-semibold text-[#1b56d8]">
            <ShieldCheck className="h-4 w-4 text-[#2c6bed]" />
            <span>Signal End-to-End Encryption Protocol</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 md:text-6xl leading-[1.15]">
            Speak Freely. <br />
            <span className="text-[#2c6bed]">Say Anything.</span>
          </h1>

          <p className="mt-5 text-base leading-relaxed text-slate-600 md:text-lg">
            Signal keeps your everyday conversations, crystal-clear voice & video calls, and shared moments in one calm space—without ads, trackers, or corporate surveillance.
          </p>

          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
            <Link
              href="/app"
              className="flex items-center justify-center gap-2.5 rounded-xl bg-[#2c6bed] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#2c6bed]/25 transition hover:bg-[#1b56d8] active:scale-[0.98]"
            >
              <MessageSquare className="h-4 w-4" />
              <span>Get Signal Web</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#features"
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-100 px-6 py-3.5 text-sm font-semibold text-slate-800 hover:bg-slate-200 transition"
            >
              <span>Explore Features</span>
            </a>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-700">
              <Lock className="h-3.5 w-3.5 text-[#2c6bed]" />
              <span>Zero Data Harvesting</span>
            </span>
            <span>•</span>
            <span>Free for iOS, Android, Mac & Windows</span>
            <span>•</span>
            <span>No Subscription Fees</span>
          </div>
        </div>

        {/* Right Column: Signal Light Interface Mockup */}
        <div className="relative mx-auto flex w-full max-w-sm justify-center">
          <div className="relative w-full rounded-3xl border border-slate-200 bg-[#f8f9fa] p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-[#2c6bed] flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  S
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900">Signal Messenger</span>
                  <p className="text-[10px] font-semibold text-[#2c6bed]">End-to-End Encrypted</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">Online</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="rounded-2xl bg-white p-3.5 text-slate-900 border border-slate-200 shadow-sm">
                <p className="font-bold text-xs text-[#2c6bed]">Maya Chen</p>
                <p className="text-xs mt-1 text-slate-700">Coffee on Sunday afternoon at 2 PM?</p>
                <span className="mt-1 block text-[9px] text-slate-400">9:42 AM</span>
              </div>

              <div className="rounded-2xl bg-[#2c6bed] p-3.5 text-white ml-auto max-w-[85%] shadow-md">
                <p className="text-xs">Sounds great! Let&apos;s meet at the usual spot.</p>
                <span className="mt-1 block text-[9px] text-blue-100 text-right font-medium">9:43 AM ✓✓</span>
              </div>

              <div className="rounded-2xl bg-white p-3.5 text-slate-900 border border-slate-200 shadow-sm">
                <p className="font-bold text-xs text-slate-900">Jon Bell</p>
                <p className="text-xs mt-1 text-slate-700">📷 Photo: Signal_Pack_01.png</p>
                <span className="mt-1 block text-[9px] text-slate-400">9:45 AM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
