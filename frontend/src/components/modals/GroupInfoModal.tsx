'use client';

import React, { useState } from 'react';
import { Conversation } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { api } from '@/lib/api';
import Avatar from '@/components/ui/avatar';
import { Users, Shield, UserPlus, UserMinus, LogOut, X, Check } from 'lucide-react';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
}

export default function GroupInfoModal({ isOpen, onClose, conversation }: GroupInfoModalProps) {
  const { user } = useAuth();
  const { contacts, fetchConversations, selectConversation } = useChat();

  const [isAdding, setIsAdding] = useState(false);
  const [selectedAddUserIds, setSelectedAddUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || conversation.type !== 'group') return null;

  const currentMember = conversation.members.find((m) => m.user_id === user?.id);
  const isAdmin = currentMember?.role === 'admin';

  const existingMemberIds = new Set(conversation.members.map((m) => m.user_id));
  const availableContacts = contacts.filter((c) => !existingMemberIds.has(c.contact_user.id));

  const toggleAddUser = (userId: string) => {
    setSelectedAddUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAddMembers = async () => {
    if (selectedAddUserIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await api.addGroupMembers(conversation.id, selectedAddUserIds);
      await fetchConversations();
      setSelectedAddUserIds([]);
      setIsAdding(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add members';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (targetUserId: string, targetName: string) => {
    const isSelf = targetUserId === user?.id;
    const confirmMsg = isSelf ? 'Are you sure you want to leave this group?' : `Remove ${targetName} from the group?`;
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setError(null);
    try {
      await api.removeGroupMember(conversation.id, targetUserId);
      await fetchConversations();
      if (isSelf) {
        selectConversation(null);
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove member';
      setError(message);
    } finally {
      setLoading(false);
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
            <h2 className="text-lg font-extrabold text-slate-900">Group Info</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Group Profile Summary */}
        <div className="flex flex-col items-center py-4 border-b border-slate-200">
          <Avatar name={conversation.title || 'Group'} url={conversation.avatar_url} size="xl" />
          <h3 className="mt-2 text-lg font-bold text-slate-900">{conversation.title}</h3>
          {conversation.description && (
            <p className="text-xs text-slate-500 text-center mt-1 font-medium">{conversation.description}</p>
          )}
          <p className="mt-1 text-[11px] font-semibold text-slate-400">{conversation.members.length} Members</p>
        </div>

        {/* Members List Header & Admin Add Action */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Members</span>
          {isAdmin && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center space-x-1 text-xs font-bold text-[#2c6bed] hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>{isAdding ? 'Cancel' : 'Add Members'}</span>
            </button>
          )}
        </div>

        {error && <p className="mt-2 text-center text-xs text-red-500 font-semibold">{error}</p>}

        {/* Add Members Panel */}
        {isAdding && (
          <div className="mt-3 space-y-2 border border-[#2c6bed]/30 bg-[#e8f0fe]/40 rounded-2xl p-3">
            <p className="text-xs font-bold text-slate-900">Select contacts to add:</p>
            <div className="max-h-36 overflow-y-auto space-y-1">
              {availableContacts.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2 font-medium">All your contacts are already in this group.</p>
              ) : (
                availableContacts.map((c) => {
                  const u = c.contact_user;
                  const isSelected = selectedAddUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleAddUser(u.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs transition ${
                        isSelected ? 'bg-white border border-[#2c6bed] shadow-xs' : 'hover:bg-white/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar name={u.display_name} url={u.avatar_url} size="sm" />
                        <span className="font-bold text-slate-900">{u.display_name}</span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-[#2c6bed]" />}
                    </div>
                  );
                })
              )}
            </div>

            {availableContacts.length > 0 && (
              <button
                onClick={handleAddMembers}
                disabled={loading || selectedAddUserIds.length === 0}
                className="w-full rounded-xl bg-[#2c6bed] py-2 text-xs font-bold text-white hover:bg-[#1b56d8] disabled:opacity-50 shadow-xs"
              >
                {loading ? 'Adding...' : `Add Selected (${selectedAddUserIds.length})`}
              </button>
            )}
          </div>
        )}

        {/* Current Members List */}
        <div className="mt-3 max-h-52 overflow-y-auto space-y-2">
          {conversation.members.map((m) => {
            const memberUser = m.user;
            const isSelf = m.user_id === user?.id;
            const isTargetAdmin = m.role === 'admin';

            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-2xl bg-[#f8f9fa] p-2.5 border border-slate-200"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Avatar
                    name={memberUser?.display_name || 'Member'}
                    url={memberUser?.avatar_url}
                    size="sm"
                    isOnline={memberUser?.is_online}
                    showOnlineDot
                  />
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span className="truncate text-xs font-bold text-slate-900">
                        {memberUser?.display_name || 'Group Member'} {isSelf && '(You)'}
                      </span>
                      {isTargetAdmin && (
                        <span className="flex items-center space-x-0.5 rounded-full bg-[#e8f0fe] border border-[#d2e3fc] px-2 py-0.5 text-[9px] font-bold text-[#1b56d8]">
                          <Shield className="h-2.5 w-2.5 text-[#2c6bed]" />
                          <span>Admin</span>
                        </span>
                      )}
                    </div>
                    <span className="truncate text-[10px] text-slate-400 font-medium">@{memberUser?.username}</span>
                  </div>
                </div>

                {/* Actions: Admin remove or leave */}
                <div className="flex items-center space-x-1">
                  {isAdmin && !isSelf && (
                    <button
                      onClick={() => handleRemoveMember(m.user_id, memberUser?.display_name || 'Member')}
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                      title="Remove Member"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                  {isSelf && (
                    <button
                      onClick={() => handleRemoveMember(user.id, 'yourself')}
                      className="flex items-center space-x-1 rounded-xl bg-red-50 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                      title="Leave Group"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Leave</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
