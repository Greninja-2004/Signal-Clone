'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Conversation, Contact } from '@/lib/types';
import { api, getToken } from '@/lib/api';
import { useAuth } from './AuthContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  contacts: Contact[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectConversation: (conv: Conversation | null) => void;
  fetchConversations: () => Promise<void>;
  fetchContacts: () => Promise<void>;
  startDirectChat: (targetUserId: string) => Promise<Conversation>;
  createGroupChat: (title: string, memberUserIds: string[], description?: string) => Promise<Conversation>;
  addContact: (contactUserId: string, alias?: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeConvIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    activeConvIdRef.current = activeConversation?.id;
  }, [activeConversation?.id]);

  const fetchConversations = useCallback(async () => {
    if (!user || !getToken()) return;
    try {
      const data = await api.getConversations();
      setConversations(
        data.map((c) => {
          if (c.id === activeConvIdRef.current) {
            return { ...c, unread_count: 0 };
          }
          return c;
        })
      );
      if (activeConvIdRef.current) {
        const updated = data.find((c) => c.id === activeConvIdRef.current);
        if (updated) setActiveConversation({ ...updated, unread_count: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    }
  }, [user]);

  const fetchContacts = useCallback(async () => {
    if (!user || !getToken()) return;
    try {
      const data = await api.getContacts();
      setContacts(data);
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    }
  }, [user]);

  useEffect(() => {
    let isSubscribed = true;
    if (user && getToken()) {
      Promise.all([api.getConversations(), api.getContacts()])
        .then(([convs, cnts]) => {
          if (!isSubscribed) return;
          setConversations(
            convs.map((c) => {
              if (c.id === activeConvIdRef.current) {
                return { ...c, unread_count: 0 };
              }
              return c;
            })
          );
          if (activeConvIdRef.current) {
            const updated = convs.find((c) => c.id === activeConvIdRef.current);
            if (updated) setActiveConversation({ ...updated, unread_count: 0 });
          }
          setContacts(cnts);
        })
        .catch((err) => console.error('Failed to initialize chat data:', err))
        .finally(() => {
          if (isSubscribed) setLoading(false);
        });
    } else {
      queueMicrotask(() => {
        if (!isSubscribed) return;
        setConversations([]);
        setActiveConversation(null);
        setContacts([]);
        setLoading(false);
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [user]);

  const selectConversation = (conv: Conversation | null) => {
    if (conv) {
      const updatedConv = { ...conv, unread_count: 0 };
      setActiveConversation(updatedConv);
      setConversations((prev) =>
        prev.map((c) => (c.id === conv.id ? updatedConv : c))
      );
    } else {
      setActiveConversation(null);
    }
  };

  const startDirectChat = async (targetUserId: string): Promise<Conversation> => {
    const conv = await api.createDirectConversation(targetUserId);
    await fetchConversations();
    selectConversation(conv);
    return conv;
  };

  const createGroupChat = async (title: string, memberUserIds: string[], description?: string): Promise<Conversation> => {
    const conv = await api.createGroupConversation({ title, member_user_ids: memberUserIds, description });
    await fetchConversations();
    selectConversation(conv);
    return conv;
  };

  const addContact = async (contactUserId: string, alias?: string) => {
    await api.addContact(contactUserId, alias);
    await fetchContacts();
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        contacts,
        loading,
        searchQuery,
        setSearchQuery,
        selectConversation,
        fetchConversations,
        fetchContacts,
        startDirectChat,
        createGroupChat,
        addContact,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
