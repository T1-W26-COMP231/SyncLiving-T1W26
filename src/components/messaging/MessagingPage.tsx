'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { HouseRules } from './HouseRules';
import { getMatches, getMessages, sendMessage, getPendingRequests, respondToMatchRequest, Match, MessageData, PendingRequest } from '../../../app/messages/actions';
import { createClient } from '@/utils/supabase/client';

interface MessagingPageProps {
  initialConversationId?: string;
}

export default function MessagingPage({ initialConversationId }: MessagingPageProps) {

  const [matches, setMatches] = useState<Match[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);

  // Stable client reference — createClient() must not be called on every render
  // or it will create a new instance each time, causing the realtime subscription
  // to be torn down and re-created on every render.
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  async function refreshData() {
    const [matchesData, pendingData] = await Promise.all([
      getMatches(),
      getPendingRequests()
    ]);
    setMatches(matchesData);
    setPendingRequests(pendingData);
    return matchesData;
  }

  useEffect(() => {
    async function init() {
      const data = await refreshData();
      // Pre-select from URL param if present, otherwise fall back to first conversation
      if (initialConversationId && data.some(m => m.id === initialConversationId)) {
        setSelectedMatchId(initialConversationId);
      } else if (data.length > 0) {
        setSelectedMatchId(data[0].id);
      }
      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRespondToRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    const result = await respondToMatchRequest(requestId, status);
    if (result.success) {
      const updatedMatches = await refreshData();
      if (status === 'accepted') {
        // If we just accepted a match, we might want to select it
        // However, we'd need to find which conversation was just created.
        // For simplicity, just refreshing is fine for now.
      }
    }
  };

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
  }, [selectedMatchId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendMessage = async (content: string) => {
    if (!selectedMatchId) return;
    try {
      const newMessage = await sendMessage(selectedMatchId, content);
      // Optimistically add the message immediately; realtime subscription
      // will also fire but the dedup check prevents it from being added twice.
      setMessages(prev => prev.find(m => m.id === newMessage.id) ? prev : [...prev, newMessage]);
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
          pendingRequests={pendingRequests}
          selectedMatchId={selectedMatchId} 
          onSelectMatch={setSelectedMatchId} 
          onAcceptRequest={(id) => handleRespondToRequest(id, 'accepted')}
          onDeclineRequest={(id) => handleRespondToRequest(id, 'declined')}
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
