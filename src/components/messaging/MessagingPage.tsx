'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { HouseRules } from './HouseRules';
import { getMatches, getMessages, sendMessage, Match, MessageData } from '../../../app/messages/actions';
import { createClient } from '@/utils/supabase/client';

export default function MessagingPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function init() {
      const data = await getMatches();
      setMatches(data);
      if (data.length > 0) {
        setSelectedMatchId(data[0].id);
      }
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    const currentId = selectedMatchId;
    if (!currentId) return;

    // 1. Initial fetch of messages
    async function fetchMessages() {
      const data = await getMessages(currentId!);
      setMessages(data);
    }
    fetchMessages();

    // 2. Real-time subscription for NEW messages
    const channel = supabase
      .channel(`realtime:messages:${currentId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${currentId}`,
        },
        (payload) => {
          const newMessage = payload.new as MessageData;
          setMessages((prev) => {
            // Avoid duplicate messages if the sender already added it optimistically
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedMatchId, supabase]);

  const handleSendMessage = async (content: string) => {
    if (!selectedMatchId) return;
    try {
      // We don't manually update the state here anymore. 
      // The Realtime subscription below will catch the 'INSERT' event 
      // and update the 'messages' state for us automatically.
      await sendMessage(selectedMatchId, content);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const selectedMatch = matches.find((m) => m.id === selectedMatchId);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-background font-sans">
      <Navbar activeTab="Messages" />
      <main className="flex flex-1 overflow-hidden">
        <Sidebar 
          matches={matches} 
          selectedMatchId={selectedMatchId} 
          onSelectMatch={setSelectedMatchId} 
          loading={loading}
        />
        <ChatArea 
          messages={messages} 
          onSendMessage={handleSendMessage}
          selectedMatch={selectedMatch}
        />
        <HouseRules />
      </main>
    </div>
  );
}
