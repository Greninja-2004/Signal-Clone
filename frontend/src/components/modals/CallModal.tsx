'use client';

import React, { useState, useEffect, useRef } from 'react';
import Avatar from '@/components/ui/avatar';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2, VolumeX, Lock } from 'lucide-react';

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  peerName: string;
  peerAvatar?: string | null;
  callType: 'voice' | 'video';
  onCallEnded?: (duration: number) => void;
}

export default function CallModal({
  isOpen,
  onClose,
  peerName,
  peerAvatar,
  callType,
  onCallEnded,
}: CallModalProps) {
  const [callState, setCallState] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function startMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err: unknown) {
        console.warn('Camera / Microphone permission error:', err);
        if (isMounted && callType === 'video') {
          setCameraError('Camera access unavailable');
        }
      }
    }

    startMedia();

    const ringTimer = setTimeout(() => {
      if (isMounted) setCallState('connected');
    }, 1500);

    return () => {
      isMounted = false;
      clearTimeout(ringTimer);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
      }
    };
  }, [isOpen, callType]);

  useEffect(() => {
    if (localVideoRef.current && mediaStreamRef.current && !isVideoOff) {
      localVideoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [isVideoOff, callState]);

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }
  };

  const handleToggleVideo = () => {
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !newVideoOff;
      });
    }
  };

  useEffect(() => {
    if (callState !== 'connected') return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  const handleEndCall = () => {
    setCallState('ended');
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    onCallEnded?.(callDuration);
    setTimeout(() => {
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainderSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs select-none font-sans">
      <div className="relative flex h-[520px] w-full max-w-md flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
        {/* Security header */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center space-x-1.5 rounded-full border border-[#d2e3fc] bg-[#e8f0fe] px-3 py-1 text-[#1b56d8] font-bold text-[11px]">
            <Lock className="h-3.5 w-3.5 text-[#2c6bed]" />
            <span>Encrypted Call</span>
          </div>

          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
            {callType === 'video' ? 'Signal Video' : 'Signal Voice'}
          </span>
        </div>

        {/* Real Camera & Avatar Viewport */}
        <div className="relative flex flex-1 flex-col items-center justify-center my-4 overflow-hidden rounded-2xl bg-[#f8f9fa] border border-slate-200">
          {!isVideoOff && callType === 'video' ? (
            <div className="relative h-full w-full flex items-center justify-center bg-slate-950">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover rounded-2xl"
              />
              <div className="absolute top-3 left-3 flex items-center space-x-1.5 rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-bold text-emerald-400 backdrop-blur-xs border border-emerald-500/30">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Camera Active</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className="relative mb-4">
                <Avatar name={peerName} url={peerAvatar} size="xl" />
                {callState === 'connecting' && (
                  <span className="absolute -inset-2 rounded-full border-2 border-[#2c6bed] animate-ping opacity-75" />
                )}
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">{peerName}</h2>
              {cameraError && (
                <p className="mt-1 text-[11px] text-amber-600 font-semibold">{cameraError}</p>
              )}
            </div>
          )}

          {/* Floating Call Status Tag */}
          <div className="absolute bottom-3 rounded-full bg-white/90 px-4 py-1 text-xs font-bold shadow-md backdrop-blur-xs border border-slate-200">
            {callState === 'connecting' && (
              <span className="text-[#2c6bed] animate-pulse">Ringing...</span>
            )}
            {callState === 'connected' && (
              <span className="text-emerald-600 font-mono">{formatDuration(callDuration)}</span>
            )}
            {callState === 'ended' && <span className="text-red-500">Call Ended</span>}
          </div>
        </div>

        {/* Bottom Control Actions */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleToggleMute}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                isMuted
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>

            <button
              onClick={handleToggleVideo}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                isVideoOff
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
            >
              {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setIsSpeakerOff(!isSpeakerOff)}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition ${
                isSpeakerOff
                  ? 'border-red-200 bg-red-50 text-red-500'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              title={isSpeakerOff ? 'Unmute Speaker' : 'Mute Speaker'}
            >
              {isSpeakerOff ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
          </div>

          <button
            onClick={handleEndCall}
            className="flex w-full items-center justify-center space-x-2 rounded-2xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-600/25 transition hover:bg-red-700 active:scale-[0.99]"
          >
            <PhoneOff className="h-5 w-5" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
