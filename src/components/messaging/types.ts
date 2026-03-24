export interface User {
  id: string;
  name: string;
  avatarUrl: string;
  isOnline?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'action';
  actionData?: {
    title: string;
    description: string;
    actionLabel: string;
  };
}

export interface Rule {
  id: string;
  title: string;
  description: string;
  status: 'accepted' | 'pending' | 'drafting';
  commentsCount?: number;
}

export interface ChatSession {
  id: string;
  participant: User;
  lastMessage: string;
  progress: number;
  totalRules: number;
  acceptedRules: number;
}
