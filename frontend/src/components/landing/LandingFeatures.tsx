'use client';

import React from 'react';
import { MessageSquare, Phone, Users, Shield, Smile, EyeOff } from 'lucide-react';

export default function LandingFeatures() {
  const features = [
    {
      icon: MessageSquare,
      title: 'Say Anything',
      description: 'Share text, voice messages, photos, videos, GIFs, and files for free. Signal uses your internet connection so you avoid SMS fees.',
    },
    {
      icon: Phone,
      title: 'Speak Freely',
      description: 'Make crystal-clear voice and video calls to people across town or across the ocean with no long-distance charges.',
    },
    {
      icon: Smile,
      title: 'Make Privacy Stick',
      description: 'Add a new layer of expression to your conversations with encrypted stickers or create and share custom sticker packs.',
    },
    {
      icon: Users,
      title: 'Get Together with Groups',
      description: 'Group chats make it simple to stay connected to your family, friends, and coworkers with full administrative controls.',
    },
  ];

  return (
    <section id="features" className="bg-[#f8f9fa] py-20 border-b border-slate-200 text-slate-900 font-sans">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-widest text-[#2c6bed]">Built for Your People</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900 md:text-4xl">Everything meaningful, minus the noise.</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 md:text-base">
            Start a quick note, settle into a long call, or gather the group. Signal stays simple so your attention stays with each other.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-2xl bg-white border border-slate-200/80 p-6 text-left shadow-sm hover:shadow-md transition">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#2c6bed] mb-5">
                  <Icon className="h-5.5 w-5.5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.description}</p>
              </article>
            );
          })}
        </div>

        {/* Privacy Banner Section */}
        <div id="privacy" className="mt-16 rounded-3xl bg-white border border-slate-200 p-8 md:p-12 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#2c6bed]">
                <Shield className="h-4 w-4" />
                <span>Privacy That Feels Natural</span>
              </div>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 md:text-4xl">Your life is not a feed.</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Signal gives you a quiet place to connect. We do not sell your attention, display ads, or turn your conversations into a product.
              </p>
            </div>

            <div className="space-y-3.5">
              <div className="rounded-2xl bg-[#f8f9fa] border border-slate-200 p-4.5">
                <p className="text-xs font-bold text-slate-900">Only the people in the chat can see it.</p>
                <p className="mt-1 text-xs text-slate-600">Signal is built to keep your personal moments personal.</p>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-[#f8f9fa] p-4.5 text-xs font-semibold text-slate-900">
                <EyeOff className="h-4 w-4 text-[#2c6bed]" />
                <span>No ads. No tracking. No public profile algorithms.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
