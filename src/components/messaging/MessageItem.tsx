import React from 'react';
import { User } from './types';
import { Button } from '@/components/ui/Button';
import { NotebookPen } from 'lucide-react';

interface MessageItemProps {
  message: {
    id: string;
    content: string;
    type?: string;
    timestamp?: string;
    created_at?: string;
    actionData?: {
      title: string;
      description: string;
      actionLabel: string;
    };
  };
  sender?: User;
  isMe?: boolean;
  onViewRule?: () => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, sender, isMe, onViewRule }) => {
  const timestamp = message.timestamp || (message.created_at ? new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');

  if (message.type === 'action' && message.actionData) {
    return (
      <div className={`flex items-start gap-3 max-w-sm ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <NotebookPen size={14} className="text-primary" />
        </div>
        <div className="flex flex-1 flex-col gap-2">
          <div className="bg-primary/5 border border-primary/20 px-3 py-2 rounded-xl">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-0.5">
              {message.actionData.title}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 italic mb-2">
              &quot;{message.actionData.description}&quot;
            </p>
            <div className={`flex gap-2 ${isMe ? 'justify-end' : ''}`}>
              <Button size="sm" onClick={onViewRule}>
                {message.actionData.actionLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3 max-w-2xl ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
      {isMe ? (
        <div className="size-10 rounded-full bg-slate-400 flex items-center justify-center shrink-0 text-white font-bold text-xs uppercase overflow-hidden">
          YOU
        </div>
      ) : (
        <img
          alt={sender?.name || 'User'}
          className="size-10 rounded-full shrink-0 object-cover"
          src={sender?.avatarUrl || `https://ui-avatars.com/api/?name=${sender?.name || 'U'}`}
        />
      )}
      <div className={`flex flex-col gap-1 ${isMe ? 'items-end' : ''}`}>
        <div className="flex items-center gap-2">
          {!isMe && <span className="text-sm font-bold">{sender?.name}</span>}
          <span className="text-[10px] text-slate-400">{timestamp}</span>
          {isMe && <span className="text-sm font-bold">You</span>}
        </div>
        <div
          className={`px-3 py-2 rounded-xl shadow-sm border ${
            isMe
              ? 'bg-primary text-white border-transparent rounded-tr-none'
              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-700 rounded-tl-none'
          }`}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  );
};
