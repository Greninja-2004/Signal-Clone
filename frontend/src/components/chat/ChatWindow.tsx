'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useSocket } from '@/context/SocketContext';
import { api } from '@/lib/api';
import Avatar from '@/components/ui/avatar';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import MessageInput from './MessageInput';
import GroupInfoModal from '@/components/modals/GroupInfoModal';
import PlaceholderModal from '@/components/modals/PlaceholderModal';
import CallModal from '@/components/modals/CallModal';
import { Phone, Video, Info, Lock, MessageSquare, ArrowLeft } from 'lucide-react';

interface ChatWindowProps {
  onCallEnded?: (
    peerName: string,
    peerAvatar: string | null | undefined,
    callType: 'voice' | 'video',
    duration: number
  ) => void;
  onBackToSidebar?: () => void;
}

export default function ChatWindow({ onCallEnded, onBackToSidebar }: ChatWindowProps) {
  const { user } = useAuth();
  const { activeConversation } = useChat();
  const {
    activeMessages,
    setActiveMessages,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    sendReadReceipt,
    typingUsers,
  } = useSocket();

  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);
  const [callState, setCallState] = useState<{
    isOpen: boolean;
    callType: 'voice' | 'video';
  }>({
    isOpen: false,
    callType: 'voice',
  });

  const [placeholderState, setPlaceholderState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    iconType: 'call' | 'video' | 'stories' | 'devices' | 'e2ee';
  }>({
    isOpen: false,
    title: '',
    description: '',
    iconType: 'call',
  });

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const convId = activeConversation?.id;
  const isGroup = activeConversation?.type === 'group';
  const peer = activeConversation?.peer;
  const title = isGroup ? activeConversation?.title || 'Group Chat' : peer?.display_name || 'Direct Chat';
  const avatarUrl = isGroup ? activeConversation?.avatar_url : peer?.avatar_url;

  useEffect(() => {
    if (!convId) return;

    let isMounted = true;

    api
      .getMessages(convId, 100)
      .then((msgs) => {
        if (!isMounted) return;
        setActiveMessages(msgs);

        const unreadIds = msgs
          .filter((m) => m.sender_id !== user?.id)
          .filter((m) => !(m.receipts || []).some((r) => r.user_id === user?.id && r.status === 'read'))
          .map((m) => m.id);

        if (unreadIds.length > 0) {
          sendReadReceipt(convId, unreadIds);
        }
      })
      .catch((err) => console.error('Failed to load message history:', err))
      .finally(() => {
        if (isMounted) setLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [convId, user?.id, sendReadReceipt, setActiveMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  if (!activeConversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-white select-none text-slate-900">
        <div className="flex flex-col items-center max-w-sm space-y-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8f0fe] text-[#2c6bed]">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Signal Web</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select a conversation from the sidebar to send end-to-end encrypted messages and calls.
          </p>
        </div>
      </div>
    );
  }

  const typingUserIds = Array.from(typingUsers[convId || ''] || []);
  const typingUserNames: string[] = [];

  if (typingUserIds.length > 0) {
    if (!isGroup && peer) {
      typingUserNames.push(peer.display_name);
    } else if (isGroup) {
      activeConversation.members.forEach((m) => {
        if (m.user && typingUserIds.includes(m.user_id)) {
          typingUserNames.push(m.user.display_name.split(' ')[0]);
        }
      });
    }
  }

  const openCall = (type: 'voice' | 'video') => {
    setCallState({ isOpen: true, callType: type });
  };

  const openPlaceholder = (
    modalTitle: string,
    desc: string,
    icon: 'call' | 'video' | 'stories' | 'devices' | 'e2ee'
  ) => {
    setPlaceholderState({
      isOpen: true,
      title: modalTitle,
      description: desc,
      iconType: icon,
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-white select-none font-sans text-slate-900">
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 md:px-6 border-b border-slate-200 bg-white">
        <div className="flex items-center space-x-3">
          {onBackToSidebar && (
            <button
              onClick={onBackToSidebar}
              className="md:hidden rounded-lg p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              title="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}

          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => isGroup && setIsGroupInfoOpen(true)}
          >
            <Avatar
              name={title}
              url={avatarUrl}
              size="md"
              isOnline={peer?.is_online}
              showOnlineDot={!isGroup}
            />
            <div>
              <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#2c6bed]">{title}</h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isGroup
                  ? `${activeConversation.members.length} members`
                  : peer?.is_online
                  ? 'Online'
                  : 'Offline'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-1 text-slate-600">
          <button
            onClick={() => openCall('voice')}
            className="rounded-lg p-2 hover:bg-slate-100 hover:text-[#2c6bed] transition"
            title="Voice Call"
          >
            <Phone className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => openCall('video')}
            className="rounded-lg p-2 hover:bg-slate-100 hover:text-[#2c6bed] transition"
            title="Video Call"
          >
            <Video className="h-4.5 w-4.5" />
          </button>
          {isGroup && (
            <button
              onClick={() => setIsGroupInfoOpen(true)}
              className="rounded-lg p-2 hover:bg-slate-100 hover:text-[#2c6bed] transition"
              title="Group Info"
            >
              <Info className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Security Banner */}
      <div
        onClick={() =>
          openPlaceholder(
            'Signal Encryption Protocol',
            'Messages and calls are end-to-end encrypted with the Signal Protocol.',
            'e2ee'
          )
        }
        className="flex items-center justify-center space-x-1.5 bg-[#e8f0fe] py-1 px-4 border-b border-[#d2e3fc] text-[11px] font-semibold text-[#1b56d8] cursor-pointer hover:underline"
      >
        <Lock className="h-3 w-3 text-[#2c6bed]" />
        <span>End-to-end encrypted</span>
      </div>

      {/* Messages Stream Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#f0f2f5]">
        {loadingHistory ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2c6bed] border-t-transparent" />
          </div>
        ) : activeMessages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 space-y-1">
            <MessageSquare className="h-6 w-6 text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">No messages yet.</p>
          </div>
        ) : (
          activeMessages.map((msg, index) => {
            const prevMsg = index > 0 ? activeMessages[index - 1] : null;
            const showSenderName = isGroup && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isGroup={isGroup}
                showSenderName={showSenderName}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <TypingIndicator typingUserNames={typingUserNames} />

      {/* Input Bar */}
      <MessageInput
        onSendMessage={(text, messageType, mediaUrl) => convId && sendMessage(convId, text, messageType, mediaUrl)}
        onTypingStart={() => convId && sendTypingStart(convId)}
        onTypingStop={() => convId && sendTypingStop(convId)}
      />

      {/* Modals */}
      {isGroup && (
        <GroupInfoModal
          isOpen={isGroupInfoOpen}
          onClose={() => setIsGroupInfoOpen(false)}
          conversation={activeConversation}
        />
      )}

      <CallModal
        isOpen={callState.isOpen}
        onClose={() => setCallState((prev) => ({ ...prev, isOpen: false }))}
        peerName={title}
        peerAvatar={avatarUrl}
        callType={callState.callType}
        onCallEnded={(dur) => onCallEnded?.(title, avatarUrl, callState.callType, dur)}
      />

      <PlaceholderModal
        isOpen={placeholderState.isOpen}
        onClose={() => setPlaceholderState((prev) => ({ ...prev, isOpen: false }))}
        title={placeholderState.title}
        description={placeholderState.description}
        iconType={placeholderState.iconType}
      />
    </div>
  );
}
