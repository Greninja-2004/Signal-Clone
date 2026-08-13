'use client';

import React from 'react';

interface TypingIndicatorProps {
  typingUserNames: string[];
}

export default function TypingIndicator({ typingUserNames }: TypingIndicatorProps) {
  if (!typingUserNames || typingUserNames.length === 0) return null;

  const label =
    typingUserNames.length === 1
      ? `${typingUserNames[0]} is typing...`
      : typingUserNames.length === 2
      ? `${typingUserNames[0]} and ${typingUserNames[1]} are typing...`
      : 'Several people are typing...';

  return (
    <div className="flex items-center space-x-2 px-4 py-1.5 text-xs text-slate-500 font-sans">
      <div className="flex space-x-1 items-center bg-slate-200/90 border border-slate-300/80 rounded-full px-3 py-1 shadow-xs">
        <span className="h-1.5 w-1.5 rounded-full bg-[#2c6bed] animate-pulse-dot" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#2c6bed] animate-pulse-dot animation-delay-200" />
        <span className="h-1.5 w-1.5 rounded-full bg-[#2c6bed] animate-pulse-dot animation-delay-400" />
        <span className="ml-1.5 text-[11px] font-semibold text-slate-700">{label}</span>
      </div>
    </div>
  );
}
