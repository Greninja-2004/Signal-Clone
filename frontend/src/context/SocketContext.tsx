'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import { Message } from '@/lib/types';

interface SocketContextType {
  isConnected: boolean;
  sendMessage: (
    conversationId: string,
    content: string,
    messageType?: 'text' | 'image' | 'file',
    mediaUrl?: string
  ) => void;

  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
  sendReadReceipt: (conversationId: string, messageIds: string[]) => void;
  typingUsers: Record<string, Set<string>>;
  activeMessages: Message[];
  setActiveMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const { activeConversation, fetchConversations } = useChat();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, Set<string>>>({});

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const connectWebSocketRef = useRef<() => void>(() => {});

  const activeConvIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    activeConvIdRef.current = activeConversation?.id;
  }, [activeConversation?.id]);

  const connectWebSocket = useCallback(() => {
    if (!token) return;

    if (socketRef.current) {
      socketRef.current.close();
    }

    // Dynamic WebSocket URL resolution for production (supports ws:// and wss://)
    let wsBaseUrl = 'ws://localhost:8000';
    if (process.env.NEXT_PUBLIC_WS_URL) {
      wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL;
    } else if (process.env.NEXT_PUBLIC_API_URL) {
      const apiHost = process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/?$/, '');
      wsBaseUrl = apiHost.replace(/^http/, 'ws');
    }

    const wsUrl = `${wsBaseUrl}/ws?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const { event: eventName, data } = payload;

        if (eventName === 'message:new') {
          const newMsg: Message = data;

          if (activeConvIdRef.current === newMsg.conversation_id) {
            setActiveMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
              socketRef.current.send(
                JSON.stringify({
                  event: 'message:read',
                  data: {
                    conversation_id: newMsg.conversation_id,
                    message_ids: [newMsg.id],
                  },
                })
              );
            }
          }

          fetchConversations();
        } else if (eventName === 'receipt:update') {
          const { conversation_id, message_ids, status, user_id } = data;

          setActiveMessages((prev) =>
            prev.map((msg) => {
              if (msg.conversation_id === conversation_id && (message_ids.includes(msg.id) || message_ids.length === 0)) {
                const existingReceipts = msg.receipts || [];
                const updatedReceipts = existingReceipts.some((r) => r.user_id === user_id)
                  ? existingReceipts.map((r) => (r.user_id === user_id ? { ...r, status } : r))
                  : [
                      ...existingReceipts,
                      {
                        id: Math.random().toString(),
                        message_id: msg.id,
                        user_id: user_id || 'peer',
                        status: status,
                        timestamp: new Date().toISOString(),
                      },
                    ];
                return { ...msg, receipts: updatedReceipts };
              }
              return msg;
            })
          );

          fetchConversations();
        } else if (eventName === 'typing:status') {
          const { conversation_id, user_id: typingUserId, is_typing } = data;
          setTypingUsers((prev) => {
            const setForConv = new Set(prev[conversation_id] || []);
            if (is_typing) {
              setForConv.add(typingUserId);
            } else {
              setForConv.delete(typingUserId);
            }
            return { ...prev, [conversation_id]: setForConv };
          });
        } else if (eventName === 'presence:update') {
          fetchConversations();
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      setIsConnected(false);

      const timeout = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
      reconnectAttemptsRef.current += 1;
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocketRef.current();
      }, timeout);
    };

    socketRef.current = ws;
  }, [token, fetchConversations]);

  useEffect(() => {
    connectWebSocketRef.current = connectWebSocket;
  }, [connectWebSocket]);

  useEffect(() => {
    if (token) {
      connectWebSocket();
    } else {
      if (socketRef.current) {
        socketRef.current.close();
      }
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [token, connectWebSocket]);

  const sendMessage = (
    conversationId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    mediaUrl?: string
  ) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          event: 'message:send',
          data: {
            conversation_id: conversationId,
            content,
            message_type: messageType,
            media_url: mediaUrl,
          },
        })
      );
    }
  };

  const sendTypingStart = (conversationId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          event: 'typing:start',
          data: { conversation_id: conversationId },
        })
      );
    }
  };

  const sendTypingStop = (conversationId: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          event: 'typing:stop',
          data: { conversation_id: conversationId },
        })
      );
    }
  };

  const sendReadReceipt = (conversationId: string, messageIds: string[]) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN && messageIds.length > 0) {
      socketRef.current.send(
        JSON.stringify({
          event: 'message:read',
          data: { conversation_id: conversationId, message_ids: messageIds },
        })
      );
    }
  };

  return (
    <SocketContext.Provider
      value={{
        isConnected,
        sendMessage,
        sendTypingStart,
        sendTypingStop,
        sendReadReceipt,
        typingUsers,
        activeMessages,
        setActiveMessages,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
