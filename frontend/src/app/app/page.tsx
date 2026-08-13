'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ChatProvider, useChat } from '@/context/ChatContext';
import { SocketProvider } from '@/context/SocketContext';
import Sidebar from '@/components/chat/Sidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import SettingsModal from '@/components/modals/SettingsModal';
import ProfileModal from '@/components/modals/ProfileModal';
import CallLogsModal, { CallLog } from '@/components/modals/CallLogsModal';
import { MessageSquare } from 'lucide-react';

function SignalChatView() {
  const { user, loading: authLoading } = useAuth();
  const { activeConversation } = useChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCallLogsOpen, setIsCallLogsOpen] = useState(false);
  const [callLogs, setCallLogs] = useState<CallLog[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('signal_call_logs');
        if (saved) return JSON.parse(saved);
      } catch (err) {
        console.error('Failed to load call logs:', err);
      }
    }
    return [];
  });
  const [mobileChatOverride, setMobileChatOverride] = useState<boolean | null>(null);
  const showMobileChat = mobileChatOverride ?? Boolean(activeConversation);

  const saveLogs = (logs: CallLog[]) => {
    setCallLogs(logs);
    try {
      localStorage.setItem('signal_call_logs', JSON.stringify(logs));
    } catch (err) {
      console.error('Failed to save call logs:', err);
    }
  };

  const handleAddCallLog = (
    peerName: string,
    peerAvatar: string | null | undefined,
    callType: 'voice' | 'video',
    duration: number
  ) => {
    const newLog: CallLog = {
      id: Math.random().toString(36).substr(2, 9),
      peerName,
      peerAvatar,
      callType,
      direction: 'outgoing',
      duration,
      timestamp: new Date().toISOString(),
    };
    saveLogs([newLog, ...callLogs]);
  };

  const handleClearLogs = () => {
    saveLogs([]);
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-white text-slate-900 font-sans select-none">
        <div className="flex flex-col items-center space-y-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2c6bed] text-white shadow-md shadow-[#2c6bed]/20">
            <MessageSquare className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold text-slate-500 animate-pulse">Connecting to Signal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-900 select-none font-sans">
      {/* Left Sidebar Pane */}
      <div
        className={`w-full md:w-80 lg:w-96 flex-shrink-0 h-full border-r border-slate-200 bg-[#f7f7f8] transition-all duration-300 ${
          showMobileChat ? 'hidden md:block' : 'block'
        }`}
      >
        <Sidebar
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenCallLogs={() => setIsCallLogsOpen(true)}
        />
      </div>

      {/* Right Chat Window Pane */}
      <div
        className={`flex-1 flex flex-col h-full bg-white relative overflow-hidden transition-all duration-300 ${
          !showMobileChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        <ChatWindow
          onCallEnded={handleAddCallLog}
          onBackToSidebar={() => setMobileChatOverride(false)}
        />
      </div>

      {/* Modals */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <CallLogsModal
        isOpen={isCallLogsOpen}
        onClose={() => setIsCallLogsOpen(false)}
        callLogs={callLogs}
        onClearLogs={handleClearLogs}
        onCallPeer={async () => {
          setIsCallLogsOpen(false);
        }}
      />
    </div>
  );
}

export default function SignalMessengerAppPage() {
  return (
    <ChatProvider>
      <SocketProvider>
        <SignalChatView />
      </SocketProvider>
    </ChatProvider>
  );
}
