'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PlusCircle, Send } from 'lucide-react';
import { MessageItem } from './MessageItem';
import { MessageData, Match } from '../../../app/messages/actions';
import { User } from './types';

interface ChatAreaProps {
  messages: MessageData[];
  onSendMessage: (content: string) => void;
  selectedMatch?: Match;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages, 
  onSendMessage, 
  selectedMatch 
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const otherUser: User | undefined = selectedMatch ? {
    id: selectedMatch.other_user.id,
    name: selectedMatch.other_user.full_name || 'User',
    avatarUrl: selectedMatch.other_user.avatar_url || `https://ui-avatars.com/api/?name=${selectedMatch.other_user.full_name || 'U'}`
  } : undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  return (
    <section className="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {!selectedMatch ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 font-medium">
          Select a match to start messaging
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex justify-center">
              <span className="px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-full text-[10px] font-bold text-slate-500 uppercase">
                Conversation started
              </span>
            </div>

            {messages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                sender={msg.sender_id === otherUser?.id ? otherUser : undefined}
                isMe={msg.sender_id !== otherUser?.id}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border-t border-primary/10">
            <form 
              className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2"
              onSubmit={handleSubmit}
            >
              <button type="button" className="text-slate-400 hover:text-primary transition-colors flex shrink-0">
                <PlusCircle size={20} />
              </button>
              <input
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 px-3 placeholder-slate-500 text-slate-900 dark:text-slate-100"
                placeholder="Type your message..."
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" className="text-primary flex shrink-0 disabled:opacity-50" disabled={!inputValue.trim()}>
                <Send size={18} />
              </button>
            </form>
          </div>
        </>
      )}
    </section>
  );
};
