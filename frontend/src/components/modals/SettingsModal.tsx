'use client';

import React, { useState } from 'react';
import { Settings, Shield, Bell, Palette, Monitor, X, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'privacy' | 'notifications' | 'appearance' | 'devices';

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('privacy');
  const [readReceipts, setReadReceipts] = useState(true);
  const [sealedSender, setSealedSender] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs font-sans">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl text-slate-900 overflow-hidden flex flex-col h-[520px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#2c6bed]">
              <Settings className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Signal Settings</h2>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body with Sidebar Tabs */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tabs Sidebar */}
          <div className="w-48 border-r border-slate-200 bg-[#f8f9fa] p-3 space-y-1">
            <button
              onClick={() => setActiveTab('privacy')}
              className={`flex w-full items-center space-x-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                activeTab === 'privacy' ? 'bg-[#2c6bed] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Privacy</span>
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex w-full items-center space-x-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                activeTab === 'notifications' ? 'bg-[#2c6bed] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex w-full items-center space-x-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                activeTab === 'appearance' ? 'bg-[#2c6bed] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Palette className="h-4 w-4" />
              <span>Appearance</span>
            </button>
            <button
              onClick={() => setActiveTab('devices')}
              className={`flex w-full items-center space-x-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition ${
                activeTab === 'devices' ? 'bg-[#2c6bed] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Monitor className="h-4 w-4" />
              <span>Linked Devices</span>
            </button>
          </div>

          {/* Tab Panels */}
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Messaging Privacy</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Read Receipts</p>
                    <p className="text-[11px] text-slate-500 font-medium">See and share when messages have been read</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={readReceipts}
                    onChange={(e) => setReadReceipts(e.target.checked)}
                    className="h-4 w-4 accent-[#2c6bed]"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Sealed Sender</p>
                    <p className="text-[11px] text-slate-500 font-medium">Encrypted sender metadata for enhanced privacy</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={sealedSender}
                    onChange={(e) => setSealedSender(e.target.checked)}
                    className="h-4 w-4 accent-[#2c6bed]"
                  />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Message Alerts</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Enable Notifications</p>
                    <p className="text-[11px] text-slate-500 font-medium">Show desktop and toast notifications</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[#2c6bed]"
                  />
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">Theme & Style</h3>
                
                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-900">Theme Mode</p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setTheme('light')}
                      className={`flex-1 rounded-2xl p-3 border text-xs font-bold text-center transition ${
                        theme === 'light' ? 'border-[#2c6bed] bg-[#e8f0fe] text-[#1b56d8] shadow-xs' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      Light Theme (Official)
                    </button>
                    <button
                      onClick={() => setTheme('dark')}
                      className={`flex-1 rounded-2xl p-3 border text-xs font-bold text-center transition ${
                        theme === 'dark' ? 'border-[#2c6bed] bg-slate-900 text-white shadow-xs' : 'border-slate-200 text-slate-500'
                      }`}
                    >
                      Dark Theme
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'devices' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <Monitor className="h-12 w-12 text-[#2c6bed]" />
                <h3 className="text-sm font-bold text-slate-900">Linked Signal Desktop</h3>
                <div className="inline-flex items-center space-x-1.5 rounded-full bg-[#e8f0fe] border border-[#d2e3fc] px-3 py-1 text-xs font-bold text-[#1b56d8]">
                  <Sparkles className="h-3.5 w-3.5 text-[#2c6bed]" />
                  <span>Feature Coming Soon</span>
                </div>
                <p className="text-xs text-slate-500 max-w-xs font-medium leading-relaxed">
                  Multi-device sync and Signal Desktop pairing will be available in the upcoming release.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
