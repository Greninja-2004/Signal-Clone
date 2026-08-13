'use client';

import React from 'react';
import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingFooter from '@/components/landing/LandingFooter';

export default function SignalLandingPage() {
  return (
    <div className="min-h-screen w-full bg-white text-slate-900 font-sans selection:bg-[#2c6bed]/20 flex flex-col overflow-y-auto">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
      </main>
      <LandingFooter />
    </div>
  );
}
