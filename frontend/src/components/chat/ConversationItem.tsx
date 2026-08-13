'use client';

import React from 'react';
import { Conversation } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import Avatar from '@/components/ui/avatar';
import { Users, Camera, Mic, FileText } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}

export function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const { user } = useAuth();

  const isGroup = conversation.type === 'group';
  const peer = conversation.peer;

  const title = isGroup ? conversation.title || 'Group Chat' : peer?.display_name || 'Direct Message';
  const avatarUrl = isGroup ? conversation.avatar_url : peer?.avatar_url;
  const isOnline = isGroup ? false : peer?.is_online || false;

  const lastMsg = conversation.last_message;
  let lastMsgText = 'No messages yet';
  let senderPrefix = '';
  let mediaIcon = null;

  if (lastMsg) {
    if (lastMsg.message_type === 'system') {
      lastMsgText = lastMsg.content;
    } else {
      if (isGroup && lastMsg.sender) {
        const isSelf = lastMsg.sender.id === user?.id;
        senderPrefix = isSelf ? 'You: ' : `${lastMsg.sender.display_name.split(' ')[0]}: `;
      }

      if (lastMsg.message_type === 'image') {
        mediaIcon = <Camera className="h-3 w-3 inline mr-1 text-[#2c6bed]" />;
        lastMsgText = `${senderPrefix}Photo`;
      } else if (lastMsg.message_type === 'voice') {
        mediaIcon = <Mic className="h-3 w-3 inline mr-1 text-purple-600" />;
        lastMsgText = `${senderPrefix}Voice message`;
      } else if (lastMsg.message_type === 'file') {
        mediaIcon = <FileText className="h-3 w-3 inline mr-1 text-emerald-600" />;
        lastMsgText = `${senderPrefix}Attachment`;
      } else {
        lastMsgText = `${senderPrefix}${lastMsg.content}`;
      }
    }
  }

  const hasUnread = conversation.unread_count > 0;
  const timeDisplay = lastMsg ? formatTime(lastMsg.created_at) : formatTime(conversation.updated_at);

  return (
    <div
      onClick={onClick}
      className={`group flex items-center space-x-3 px-3.5 py-3 transition cursor-pointer border-b border-slate-200/60 ${
        isActive
          ? 'bg-[#e8f0fe] border-l-4 border-l-[#2c6bed]'
          : 'hover:bg-slate-200/50'
      }`}
    >
      {/* Avatar */}
      <Avatar
        name={title}
        url={avatarUrl}
        size="md"
        isOnline={isOnline}
        showOnlineDot={!isGroup}
      />

      {/* Middle Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 min-w-0">
            {isGroup && <Users className="h-3.5 w-3.5 text-[#2c6bed] flex-shrink-0" />}
            <span
              className={`truncate text-xs ${
                hasUnread || isActive ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'
              }`}
            >
              {title}
            </span>
          </div>

          <span className={`text-[11px] flex-shrink-0 ${hasUnread ? 'text-[#2c6bed] font-bold' : 'text-slate-500'}`}>
            {timeDisplay}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between">
          <p
            className={`truncate text-xs ${
              hasUnread
                ? 'font-bold text-slate-900'
                : 'text-slate-600'
            }`}
          >
            {mediaIcon}
            {lastMsgText}
          </p>

          {hasUnread && (
            <span className="ml-2 flex h-4 min-w-[16px] flex-shrink-0 items-center justify-center rounded-full bg-[#2c6bed] px-1 text-[10px] font-bold text-white shadow-xs">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
