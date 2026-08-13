'use client';

import React, { useState } from 'react';
import { useChat } from '@/context/ChatContext';
import Avatar from '@/components/ui/avatar';
import { Users, X, Check } from 'lucide-react';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewGroupModal({ isOpen, onClose }: NewGroupModalProps) {
  const { contacts, createGroupChat } = useChat();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Group name is required');
      return;
    }
    if (selectedUserIds.length === 0) {
      setError('Select at least one contact to join group');
      return;
    }
    setCreating(true);
    setError(null);
    try {
      await createGroupChat(title.trim(), selectedUserIds, description.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create group';
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs font-sans">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#2c6bed]">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">New Group</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Group Name</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Signal Dev Team"
              className="w-full rounded-2xl border border-slate-200 bg-[#f0f2f5] px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#2c6bed] focus:bg-white focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this group about?"
              className="w-full rounded-2xl border border-slate-200 bg-[#f0f2f5] px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-[#2c6bed] focus:bg-white focus:outline-none transition"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700">Select Members ({selectedUserIds.length})</label>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-200 rounded-2xl p-2 bg-[#f8f9fa]">
              {contacts.length === 0 ? (
                <p className="p-3 text-center text-xs text-slate-500 font-medium">No contacts added yet. Use Add Contact first.</p>
              ) : (
                contacts.map((c) => {
                  const u = c.contact_user;
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUser(u.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition ${
                        isSelected ? 'bg-white border border-[#2c6bed] shadow-xs' : 'hover:bg-slate-200/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Avatar name={u.display_name} url={u.avatar_url} size="sm" isOnline={u.is_online} showOnlineDot />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-slate-900">{u.display_name}</p>
                          <p className="truncate text-[10px] text-slate-500">@{u.username}</p>
                        </div>
                      </div>

                      <div
                        className={`h-5 w-5 rounded-lg flex items-center justify-center border transition ${
                          isSelected ? 'bg-[#2c6bed] border-[#2c6bed] text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {error && <p className="text-center text-xs text-red-500 font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={creating}
            className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-[#2c6bed] py-3 text-xs font-bold text-white transition hover:bg-[#1b56d8] disabled:opacity-50 shadow-sm shadow-[#2c6bed]/20"
          >
            {creating ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <span>Create Group Chat</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
