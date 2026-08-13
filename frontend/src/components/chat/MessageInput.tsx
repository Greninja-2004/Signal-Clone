'use client';

import React, { useState, useRef } from 'react';
import { Send, Smile, Paperclip, X, FileText } from 'lucide-react';
import { api } from '@/lib/api';

interface MessageInputProps {
  onSendMessage: (content: string, messageType?: 'text' | 'image' | 'file', mediaUrl?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

interface AttachmentPreview {
  file: File;
  media_url: string;
  filename: string;
  message_type: 'image' | 'file';
}

const EMOJI_PRESETS = ['👍', '❤️', '😂', '🔥', '🎉', '😊', '🙏', '💯'];

export default function MessageInput({ onSendMessage, onTypingStart, onTypingStop }: MessageInputProps) {
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<AttachmentPreview | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const backendHost = process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:8000';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setContent(val);

    if (val.trim()) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        onTypingStart();
      }

      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);

      typingTimerRef.current = setTimeout(() => {
        isTypingRef.current = false;
        onTypingStop();
      }, 1500);
    } else {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        onTypingStop();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadAttachment(file);
      setAttachment({
        file,
        media_url: res.media_url,
        filename: res.filename,
        message_type: res.message_type,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      alert(`Upload failed: ${message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim() && !attachment) return;

    if (attachment) {
      onSendMessage(content.trim(), attachment.message_type, attachment.media_url);
    } else {
      onSendMessage(content.trim(), 'text');
    }

    setContent('');
    setAttachment(null);
    setShowEmojiPicker(false);

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    isTypingRef.current = false;
    onTypingStop();
  };

  return (
    <div className="relative flex flex-col border-t border-slate-200 bg-white font-sans text-slate-900">
      {/* Quick Emoji Picker Bar */}
      {showEmojiPicker && (
        <div className="flex items-center space-x-1.5 border-b border-slate-200 bg-[#f8f9fa] px-3.5 py-1.5">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Emojis:</span>
          {EMOJI_PRESETS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setContent((prev) => prev + emoji)}
              className="rounded-lg p-1 text-sm hover:bg-slate-200/80 transition"
            >
              {emoji}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(false)}
            className="ml-auto text-slate-400 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Preview Banner */}
      {attachment && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#f8f9fa] px-3.5 py-2 text-xs text-slate-900">
          <div className="flex items-center space-x-2.5 min-w-0">
            {attachment.message_type === 'image' ? (
              <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-slate-200">
                <img
                  src={attachment.media_url.startsWith('/') ? `${backendHost}${attachment.media_url}` : attachment.media_url}
                  alt={attachment.filename}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f0fe] text-[#2c6bed]">
                <FileText className="h-4 w-4" />
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">{attachment.filename}</p>
              <p className="text-[10px] text-slate-500 font-medium">Ready to send</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center space-x-2.5 p-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-[#2c6bed] transition disabled:opacity-50"
          title="Attach File"
        >
          {uploading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#2c6bed] border-t-transparent" />
          ) : (
            <Paperclip className="h-4.5 w-4.5" />
          )}
        </button>

        <div className="relative flex-1">
          <input
            type="text"
            value={content}
            onChange={handleInputChange}
            placeholder={attachment ? 'Add a caption...' : 'New message'}
            className="w-full rounded-2xl border border-slate-200 bg-[#f0f2f5] py-2 pl-3.5 pr-9 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#2c6bed] focus:outline-none transition"
          />
          <button
            type="button"
            className="absolute right-2.5 top-2 text-slate-400 hover:text-[#2c6bed] transition"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
          >
            <Smile className="h-4 w-4" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!content.trim() && !attachment}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2c6bed] text-white transition hover:bg-[#1b56d8] disabled:opacity-40 shadow-sm shadow-[#2c6bed]/20 active:scale-[0.98]"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
