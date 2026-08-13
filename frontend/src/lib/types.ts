export interface User {
  id: string;
  phone: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  about?: string;
  is_online: boolean;
  last_seen: string;
  created_at: string;
}

export interface Contact {
  id: string;
  contact_user: User;
  alias?: string;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  user?: User;
}

export interface MessageReceipt {
  id: string;
  message_id: string;
  user_id: string;
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
}

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender?: User;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'voice' | 'system';
  media_url?: string;
  reply_to_id?: string;
  is_deleted: boolean;
  created_at: string;
  receipts?: MessageReceipt[];
  reactions?: MessageReaction[];
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  title?: string;
  avatar_url?: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  members: ConversationMember[];
  last_message?: Message;
  unread_count: number;
  peer?: User; // For direct chats
}
