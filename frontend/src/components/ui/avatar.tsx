"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }

// --- Signal Custom Avatar Default Export ---
const SIGNAL_AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-amber-600',
  'bg-sky-600',
  'bg-rose-600',
  'bg-purple-600',
  'bg-teal-600',
  'bg-blue-600',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SIGNAL_AVATAR_COLORS.length;
  return SIGNAL_AVATAR_COLORS[index];
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface SignalAvatarProps {
  name: string;
  url?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isOnline?: boolean;
  showOnlineDot?: boolean;
}

export default function SignalAvatar({
  name,
  url,
  size = 'md',
  isOnline = false,
  showOnlineDot = false,
}: SignalAvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-11 w-11 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-xl',
  }[size];

  const dotSizeClasses = {
    sm: 'h-2.5 w-2.5 border',
    md: 'h-3.5 w-3.5 border-2',
    lg: 'h-4 w-4 border-2',
    xl: 'h-5 w-5 border-2',
  }[size];

  const bgColor = getAvatarColor(name || 'Signal User');
  const initials = getInitials(name || 'User');

  const fullUrl = url?.startsWith('/') ? `http://localhost:8000${url}` : url;

  return (
    <div className="relative inline-block flex-shrink-0">
      <div
        className={`${sizeClasses} flex items-center justify-center overflow-hidden rounded-full font-bold text-white shadow-sm ${bgColor}`}
      >
        {fullUrl && !imgError ? (
          <img
            src={fullUrl}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      {showOnlineDot && isOnline && (
        <span
          className={`absolute bottom-0 right-0 rounded-full bg-green-500 border-[#17181c] ${dotSizeClasses}`}
          title="Online"
        />
      )}
    </div>
  );
}
