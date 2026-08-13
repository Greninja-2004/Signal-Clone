'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import Avatar from '@/components/ui/avatar';
import ConversationItem from './ConversationItem';
import AddContactModal from '@/components/modals/AddContactModal';
import NewGroupModal from '@/components/modals/NewGroupModal';
import { Search, UserPlus, Users, Settings, LogOut, X, MessageSquare, PhoneCall } from 'lucide-react';

interface SidebarProps {
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
  onOpenCallLogs?: () => void;
}

type FilterTab = 'all' | 'direct' | 'group';

export default function Sidebar({ onOpenSettings, onOpenProfile, onOpenCallLogs }: SidebarProps) {
  const { user, logout } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    contacts,
    searchQuery,
    setSearchQuery,
    loading,
    startDirectChat,
  } = useChat();

  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const query = searchQuery.trim().toLowerCase();

  const filteredConversations = conversations.filter((c) => {
    if (activeTab === 'direct' && c.type !== 'direct') return false;
    if (activeTab === 'group' && c.type !== 'group') return false;

    if (!query) return true;
    if (c.type === 'group') {
      return (
        c.title?.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query) ||
        c.last_message?.content.toLowerCase().includes(query)
      );
    } else {
      const peer = c.peer;
      return (
        peer?.display_name.toLowerCase().includes(query) ||
        peer?.username.toLowerCase().includes(query) ||
        peer?.phone.toLowerCase().includes(query) ||
        c.last_message?.content.toLowerCase().includes(query)
      );
    }
  });

  const existingPeerIds = new Set(
    conversations.filter((c) => c.type === 'direct').map((c) => c.peer?.id)
  );

  const filteredContacts = query
    ? contacts.filter(
        (cnt) =>
          !existingPeerIds.has(cnt.contact_user.id) &&
          (cnt.contact_user.display_name.toLowerCase().includes(query) ||
            cnt.contact_user.username.toLowerCase().includes(query) ||
            cnt.contact_user.phone.toLowerCase().includes(query))
      )
    : [];

  return (
    <div className="flex h-full w-full flex-col bg-[#f7f7f8] border-r border-slate-200 select-none font-sans text-slate-900">
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-slate-200 bg-white">
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={onOpenProfile}
        >
          {user && (
            <Avatar
              name={user.display_name}
              url={user.avatar_url}
              size="md"
              isOnline={user.is_online}
              showOnlineDot
            />
          )}
          <span className="font-bold text-sm text-slate-900 tracking-tight group-hover:text-[#2c6bed]">Signal</span>
        </div>

        <div className="flex items-center space-x-0.5 text-slate-600">
          <button
            onClick={() => setIsAddContactOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-100 hover:text-[#2c6bed] transition"
            title="Add Contact"
          >
            <UserPlus className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => setIsNewGroupOpen(true)}
            className="rounded-lg p-2 hover:bg-slate-100 hover:text-[#2c6bed] transition"
            title="New Group Chat"
          >
            <Users className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={onOpenCallLogs}
            className="rounded-lg p-2 hover:bg-slate-100 hover:text-[#2c6bed] transition"
            title="Call History Logs"
          >
            <PhoneCall className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={onOpenSettings}
            className="rounded-lg p-2 hover:bg-slate-100 hover:text-[#2c6bed] transition"
            title="Settings"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Search Input Bar & Filter Tabs */}
      <div className="p-3 space-y-2.5 border-b border-slate-200 bg-white">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Signal chats..."
            className="w-full rounded-xl border border-slate-200 bg-[#f0f2f5] py-2 pl-9 pr-8 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#2c6bed] focus:outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center space-x-1.5 pt-0.5">
          <button
            onClick={() => setActiveTab('all')}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              activeTab === 'all'
                ? 'bg-[#2c6bed] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('direct')}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              activeTab === 'direct'
                ? 'bg-[#2c6bed] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Direct
          </button>
          <button
            onClick={() => setActiveTab('group')}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              activeTab === 'group'
                ? 'bg-[#2c6bed] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto bg-[#f7f7f8]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-8 space-y-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#2c6bed] border-t-transparent" />
            <p className="text-xs text-slate-500 font-medium">Loading chats...</p>
          </div>
        ) : filteredConversations.length === 0 && filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500 space-y-2">
            <MessageSquare className="h-6 w-6 text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">No chats found</p>
          </div>
        ) : (
          <>
            {filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={activeConversation?.id === conv.id}
                onClick={() => selectConversation(conv)}
              />
            ))}

            {filteredContacts.length > 0 && (
              <div className="mt-2">
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider bg-slate-200/60 border-y border-slate-200">
                  Contacts
                </div>
                {filteredContacts.map((cnt) => {
                  const u = cnt.contact_user;
                  return (
                    <div
                      key={u.id}
                      onClick={() => startDirectChat(u.id)}
                      className="flex items-center space-x-3 px-3.5 py-2.5 hover:bg-slate-200/50 cursor-pointer transition border-b border-slate-200/60"
                    >
                      <Avatar name={u.display_name} url={u.avatar_url} size="md" isOnline={u.is_online} showOnlineDot />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-900">{u.display_name}</p>
                        <p className="truncate text-[11px] text-slate-500">@{u.username}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddContactModal isOpen={isAddContactOpen} onClose={() => setIsAddContactOpen(false)} />
      <NewGroupModal isOpen={isNewGroupOpen} onClose={() => setIsNewGroupOpen(false)} />
    </div>
  );
}
