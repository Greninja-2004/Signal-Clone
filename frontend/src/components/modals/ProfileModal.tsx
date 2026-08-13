'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import Avatar from '@/components/ui/avatar';
import { User, X, Upload, Save, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, refreshUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [about, setAbout] = useState(user?.about || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen || !user) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.uploadAvatar(file);
      setAvatarUrl(res.avatar_url);
    } catch (err) {
      console.error('Failed avatar upload:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile({
        display_name: displayName.trim(),
        about: about.trim(),
        avatar_url: avatarUrl,
      });
      await refreshUser();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs font-sans">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#2c6bed]">
              <User className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Profile</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div className="flex flex-col items-center py-2">
            <Avatar name={displayName || user.display_name} url={avatarUrl} size="xl" isOnline showOnlineDot />
            <label className="mt-2.5 flex cursor-pointer items-center space-x-1.5 text-xs font-bold text-[#2c6bed] hover:underline">
              <Upload className="h-3.5 w-3.5" />
              <span>{uploading ? 'Uploading...' : 'Change Photo'}</span>
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-[#f0f2f5] px-4 py-2.5 text-xs text-slate-900 focus:border-[#2c6bed] focus:bg-white focus:outline-none transition"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Username handle</label>
            <input
              type="text"
              value={`@${user.username}`}
              disabled
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs text-slate-400 font-medium cursor-not-allowed"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">Phone Number</label>
            <input
              type="text"
              value={user.phone}
              disabled
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs text-slate-400 font-medium cursor-not-allowed"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-slate-700">About Status</label>
            <input
              type="text"
              value={about}
              onChange={(e) => setAbout(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-[#f0f2f5] px-4 py-2.5 text-xs text-slate-900 focus:border-[#2c6bed] focus:bg-white focus:outline-none transition"
            />
          </div>

          {savedSuccess && (
            <div className="flex items-center justify-center space-x-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs font-bold text-emerald-700">
              <Check className="h-4 w-4" />
              <span>Profile updated successfully</span>
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-[#2c6bed] py-3 text-xs font-bold text-white transition hover:bg-[#1b56d8] disabled:opacity-50 shadow-sm shadow-[#2c6bed]/20"
          >
            {saving ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
