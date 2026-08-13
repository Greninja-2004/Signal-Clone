import { User, Contact, Conversation, Message } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('signal_token');
}

export function setToken(token: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('signal_token', token);
  document.cookie = `signal_token=${token}; path=/; max-age=604800; SameSite=Lax`;
}

export function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('signal_token');
  document.cookie = 'signal_token=; path=/; max-age=0;';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.detail || data.message || 'API request failed');
  }

  return data as T;
}

export const api = {
  // Auth
  sendOtp: (phone_or_username: string) =>
    request<{ status: string; message: string; fixed_otp: string; is_registered: boolean }>(
      '/auth/send-otp',
      { method: 'POST', body: JSON.stringify({ phone_or_username }) }
    ),

  verifyOtp: (phone_or_username: string, otp: string) =>
    request<{
      access_token?: string;
      user?: User;
      is_new_user: boolean;
      message: string;
    }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_or_username, otp }),
    }),

  register: (payload: {
    phone: string;
    username: string;
    display_name: string;
    about?: string;
    avatar_url?: string;
  }) =>
    request<{
      access_token: string;
      user: User;
      is_new_user: boolean;
      message: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<User>('/auth/me'),

  // Avatar upload
  uploadAvatar: async (file: File): Promise<{ avatar_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ avatar_url: string }>('/users/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  uploadAttachment: async (
    file: File
  ): Promise<{ media_url: string; filename: string; content_type: string; message_type: 'image' | 'file' }> => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ media_url: string; filename: string; content_type: string; message_type: 'image' | 'file' }>(
      '/users/attachment',
      {
        method: 'POST',
        body: formData,
      }
    );
  },


  // Users & Contacts
  searchUsers: (query: string) => request<User[]>(`/users/search?q=${encodeURIComponent(query)}`),
  updateProfile: (payload: Partial<User>) =>
    request<User>('/users/me', { method: 'PUT', body: JSON.stringify(payload) }),
  getContacts: () => request<Contact[]>('/users/contacts'),
  addContact: (contactUserId: string, alias?: string) =>
    request<{ message: string }>(`/users/contacts/${contactUserId}`, {
      method: 'POST',
      body: JSON.stringify({ alias }),
    }),

  // Conversations
  getConversations: () => request<Conversation[]>('/conversations'),
  createDirectConversation: (target_user_id: string) =>
    request<Conversation>('/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ target_user_id }),
    }),
  createGroupConversation: (payload: { title: string; member_user_ids: string[]; description?: string; avatar_url?: string }) =>
    request<Conversation>('/conversations/group', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  addGroupMembers: (conversationId: string, userIds: string[]) =>
    request<{ message: string }>(`/conversations/${conversationId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_ids: userIds }),
    }),
  removeGroupMember: (conversationId: string, targetUserId: string) =>
    request<{ message: string }>(`/conversations/${conversationId}/members/${targetUserId}`, {
      method: 'DELETE',
    }),
  getMessages: (conversationId: string, limit: number = 50) =>
    request<Message[]>(`/conversations/${conversationId}/messages?limit=${limit}`),
};


