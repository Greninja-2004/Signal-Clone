'use client';

import React from 'react';
import { X, Phone, Video, PhoneIncoming, PhoneOutgoing, Clock, Trash2 } from 'lucide-react';
import Avatar from '@/components/ui/avatar';

export interface CallLog {
  id: string;
  peerName: string;
  peerAvatar?: string | null;
  callType: 'voice' | 'video';
  direction: 'incoming' | 'outgoing';
  duration: number; // in seconds
  timestamp: string;
}

interface CallLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  callLogs: CallLog[];
  onClearLogs: () => void;
  onCallPeer: (peerName: string, peerAvatar: string | null | undefined, type: 'voice' | 'video') => void;
}

export default function CallLogsModal({
  isOpen,
  onClose,
  callLogs,
  onClearLogs,
  onCallPeer,
}: CallLogsModalProps) {
  if (!isOpen) return null;

  const formatDuration = (seconds: number) => {
    if (seconds <= 0) return 'Missed';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins > 0 ? `${mins}m ` : ''}${secs}s`;
  };

  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs select-none font-sans">
      <div className="flex h-[520px] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl text-slate-900">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f0fe] text-[#2c6bed]">
              <Clock className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-900">Call History</h2>
          </div>

          <div className="flex items-center space-x-1.5">
            {callLogs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                title="Clear Call History"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Call Logs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {callLogs.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-1">
                <Phone className="h-7 w-7" />
              </div>
              <p className="text-sm font-bold text-slate-800">No Call History</p>
              <p className="text-xs max-w-xs text-slate-500 leading-relaxed">
                Voice and video calls initiated with contacts will be recorded here.
              </p>
            </div>
          ) : (
            callLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#f8f9fa] p-3 transition hover:bg-slate-100/70"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <Avatar name={log.peerName} url={log.peerAvatar} size="md" />
                  <div className="min-w-0">
                    <h4 className="truncate font-bold text-xs text-slate-900">{log.peerName}</h4>
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 mt-0.5 font-medium">
                      {log.direction === 'outgoing' ? (
                        <PhoneOutgoing className="h-3.5 w-3.5 text-[#2c6bed]" />
                      ) : (
                        <PhoneIncoming className="h-3.5 w-3.5 text-emerald-500" />
                      )}
                      <span className="capitalize">{log.callType} call</span>
                      <span>•</span>
                      <span className="font-mono text-[11px]">{formatDuration(log.duration)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] text-slate-400 font-medium">{formatTime(log.timestamp)}</span>
                  <button
                    onClick={() => {
                      onClose();
                      onCallPeer(log.peerName, log.peerAvatar, log.callType);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f0fe] text-[#2c6bed] hover:bg-[#2c6bed] hover:text-white transition shadow-xs"
                    title={`Call ${log.peerName}`}
                  >
                    {log.callType === 'video' ? (
                      <Video className="h-4 w-4" />
                    ) : (
                      <Phone className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
