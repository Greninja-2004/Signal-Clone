'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { User } from '@/lib/types';
import { useChat } from '@/context/ChatContext';
import Avatar from '@/components/ui/avatar';
import { Search, UserPlus, MessageSquare, X, Check } from 'lucide-react';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddContactModal({ isOpen, onClose }: AddContactModalProps) {
  const { addContact, startDirectChat, contacts } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const existingContactUserIds = new Set(contacts.map((c) => c.contact_user.id));

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const data = await api.searchUsers(query.trim());
      setResults(data);
      if (data.length === 0) {
        setError('No Signal users found matching search.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to search users';
      setError(message);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (user: User) => {
    try {
      await addContact(user.id);
      setAddedIds((prev) => [...prev, user.id]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add contact';
      setError(message);
    }
  };

  const handleStartChat = async (user: User) => {
    try {
      await startDirectChat(user.id);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start conversation';
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs font-sans">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#2c6bed]">
              <UserPlus className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Add Contact</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearch} className="mt-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search phone (+1...) or @username..."
              className="w-full rounded-2xl border border-slate-200 bg-[#f0f2f5] py-2.5 pl-10 pr-20 text-xs text-slate-900 placeholder-slate-400 focus:border-[#2c6bed] focus:bg-white focus:outline-none transition"
              autoFocus
            />
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="absolute right-2 top-1.5 rounded-xl bg-[#2c6bed] px-3.5 py-1 text-xs font-semibold text-white hover:bg-[#1b56d8] disabled:opacity-50 shadow-xs"
            >
              {searching ? '...' : 'Search'}
            </button>
          </div>
        </form>

        {error && (
          <p className="mt-3 text-center text-xs text-red-500 font-medium">{error}</p>
        )}

        {/* Results */}
        <div className="mt-4 max-h-60 overflow-y-auto space-y-2">
          {results.map((u) => {
            const isAdded = addedIds.includes(u.id) || existingContactUserIds.has(u.id);
            return (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#f8f9fa] p-3 transition hover:border-[#2c6bed]/30"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Avatar name={u.display_name} url={u.avatar_url} size="md" isOnline={u.is_online} showOnlineDot />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{u.display_name}</p>
                    <p className="truncate text-[11px] text-slate-500">@{u.username} • {u.phone}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {!isAdded ? (
                    <button
                      onClick={() => handleAdd(u)}
                      className="flex items-center space-x-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>Add</span>
                    </button>
                  ) : (
                    <span className="flex items-center space-x-1 text-xs text-emerald-600 font-bold px-2 py-1">
                      <Check className="h-3.5 w-3.5" />
                      <span>Added</span>
                    </span>
                  )}

                  <button
                    onClick={() => handleStartChat(u)}
                    className="flex items-center space-x-1 rounded-xl bg-[#2c6bed] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#1b56d8] shadow-xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
