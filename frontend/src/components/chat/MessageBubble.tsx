'use client';

import React, { useState } from 'react';
import { Message } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Check, CheckCheck, FileText, Download, X, Play } from 'lucide-react';
import Avatar from '@/components/ui/avatar';

interface MessageBubbleProps {
  message: Message;
  isGroup: boolean;
  showSenderName?: boolean;
}

export function formatMessageTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function MessageBubble({ message, isGroup, showSenderName }: MessageBubbleProps) {
  const { user } = useAuth();
  const [showImageLightbox, setShowImageLightbox] = useState(false);

  const isSelf = message.sender_id === user?.id;
  const isSystem = message.message_type === 'system';

  if (isSystem) {
    return (
      <div className="my-2.5 flex justify-center">
        <div className="rounded-full bg-slate-200/80 border border-slate-300 px-3.5 py-1 text-center text-[11px] font-semibold text-slate-600 shadow-xs">
          {message.content}
        </div>
      </div>
    );
  }

  // Receipts status checkmarks
  let statusIcon = <Check className="h-3.5 w-3.5 text-blue-200" />;
  const receipts = message.receipts || [];
  const isRead = receipts.some((r) => r.status === 'read');
  const isDelivered = receipts.some((r) => r.status === 'delivered' || r.status === 'read');

  if (isRead) {
    statusIcon = <CheckCheck className="h-3.5 w-3.5 text-sky-200" />;
  } else if (isDelivered) {
    statusIcon = <CheckCheck className="h-3.5 w-3.5 text-blue-100" />;
  } else {
    statusIcon = <Check className="h-3.5 w-3.5 text-blue-200" />;
  }

  const backendHost = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:8000';

  const mediaUrl = message.media_url
    ? message.media_url.startsWith('/')
      ? `${backendHost}${message.media_url}`
      : message.media_url
    : null;

  const isImage = message.message_type === 'image' || (mediaUrl && /\.(png|jpe?g|gif|webp)$/i.test(mediaUrl));
  const isVoice = message.message_type === 'voice';

  return (
    <div className={`my-1 flex w-full flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
      <div className={`flex max-w-[80%] md:max-w-[70%] space-x-2 ${isSelf ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        {!isSelf && isGroup && (
          <Avatar
            name={message.sender?.display_name || 'User'}
            url={message.sender?.avatar_url}
            size="sm"
          />
        )}

        <div
          className={`relative rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
            isSelf
              ? 'bg-[#2c6bed] text-white rounded-br-xs'
              : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs'
          }`}
        >
          {!isSelf && isGroup && showSenderName && (
            <p className="mb-1 text-[11px] font-bold text-[#2c6bed]">
              {message.sender?.display_name || 'Group Member'}
            </p>
          )}

          {/* Media Attachment Rendering */}
          {mediaUrl && (
            <div className="mb-1.5">
              {isImage ? (
                <div
                  onClick={() => setShowImageLightbox(true)}
                  className="cursor-pointer overflow-hidden rounded-xl border border-black/10 max-w-xs"
                >
                  <img src={mediaUrl} alt="Attachment" className="max-h-60 w-full object-cover" />
                </div>
              ) : isVoice ? (
                <div className={`flex items-center space-x-2.5 rounded-xl p-2 border ${
                  isSelf ? 'bg-white/15 border-white/20 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
                }`}>
                  <button className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    isSelf ? 'bg-white text-[#2c6bed]' : 'bg-[#2c6bed] text-white'
                  }`}>
                    <Play className="h-3.5 w-3.5 ml-0.5" />
                  </button>
                  <div className="flex-1 space-y-0.5">
                    <p className="text-[10px] font-medium opacity-90">Voice message (0:12)</p>
                  </div>
                </div>
              ) : (
                <a
                  href={mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className={`flex items-center space-x-2.5 rounded-xl p-2 border transition ${
                    isSelf
                      ? 'bg-white/15 border-white/20 text-white'
                      : 'bg-slate-100 border-slate-200 text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <FileText className={`h-4 w-4 ${isSelf ? 'text-white' : 'text-[#2c6bed]'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{mediaUrl.split('/').pop()}</p>
                  </div>
                  <Download className="h-3.5 w-3.5 opacity-80" />
                </a>
              )}
            </div>
          )}

          {/* Text Content */}
          {message.content && (!mediaUrl || (message.content !== '📷 Photo' && message.content !== '📎 Attachment')) && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Time & Receipt status */}
          <div className={`mt-1 flex items-center justify-end space-x-1 text-[10px] ${isSelf ? 'text-blue-100 font-medium' : 'text-slate-400 font-medium'}`}>
            <span>{formatMessageTime(message.created_at)}</span>
            {isSelf && <span className="ml-1 flex items-center">{statusIcon}</span>}
          </div>
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {showImageLightbox && mediaUrl && (
        <div
          onClick={() => setShowImageLightbox(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 cursor-pointer backdrop-blur-xs"
        >
          <button
            onClick={() => setShowImageLightbox(false)}
            className="absolute top-5 right-5 rounded-full bg-slate-900/80 p-2 text-white hover:bg-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
          <img src={mediaUrl} alt="Expanded Attachment" className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl border border-white/10 shadow-2xl" />
        </div>
      )}
    </div>
  );
}
