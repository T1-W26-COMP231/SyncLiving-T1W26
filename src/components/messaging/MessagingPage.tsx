"use client";

import React, { useState, useEffect, useRef } from "react";
import Navbar from "@/components/layout/Navbar";
import { Sidebar } from "./Sidebar";
import { ChatArea } from "./ChatArea";
import { HouseRules } from "./HouseRules";
import {
  getMatches,
  getMessages,
  sendMessage,
  markMessagesAsRead,
  Match,
  MessageData,
} from "../../../app/messages/actions";
import { createClient } from "@/utils/supabase/client";

interface MessagingPageProps {
  initialConversationId?: string;
}

export default function MessagingPage({
  initialConversationId,
}: MessagingPageProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [ruleStats, setRuleStats] = useState<
    { accepted: number; total: number } | undefined
  >();

  // Stable client reference — createClient() must not be called on every render
  // or it will create a new instance each time, causing the realtime subscription
  // to be torn down and re-created on every render.
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  async function refreshData() {
    const matchesData = await getMatches();
    setMatches(matchesData);
    return matchesData;
  }

  useEffect(() => {
    async function init() {
      // Fetch current user identity alongside matches
      const [
        data,
        {
          data: { user },
        },
      ] = await Promise.all([refreshData(), supabase.auth.getUser()]);
      if (user) setCurrentUserId(user.id);
      // Pre-select from URL param if present, otherwise fall back to first conversation
      if (
        initialConversationId &&
        data.some((m) => m.id === initialConversationId)
      ) {
        setSelectedMatchId(initialConversationId);
      } else if (data.length > 0) {
        setSelectedMatchId(data[0].id);
      }
      setLoading(false);
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const currentId = selectedMatchId;
    if (!currentId) return;

    // 1. Initial fetch of messages + mark them as read
    async function fetchMessages() {
      const data = await getMessages(currentId!);
      setMessages(data);
      await markMessagesAsRead(currentId!);
    }
    fetchMessages();

    // 2. Real-time subscription for NEW messages
    const channel = supabase
      .channel(`realtime:messages:${currentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${currentId}`,
        },
        (payload) => {
          const newMessage = payload.new as MessageData;
          setMessages((prev) => {
            // Avoid duplicate messages if the sender already added it optimistically
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          // Mark as read immediately since the conversation is open
          markMessagesAsRead(currentId!);
        },
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
      setMessages((prev) =>
        prev.find((m) => m.id === newMessage.id) ? prev : [...prev, newMessage],
      );
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  // This callback is passed down to the HouseRules component, which calls it whenever the user accepts or rejects a rule.
  const handleStatsChange = useCallback((accepted: number, total: number) => {
    setRuleStats({ accepted, total });
  }, []);

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
          ruleStats={ruleStats}
        />
        <ChatArea
          messages={messages}
          onSendMessage={handleSendMessage}
          selectedMatch={selectedMatch}
        />
        <HouseRules
          conversationId={selectedMatchId}
          currentUserId={currentUserId}
          onStatsChange={handleStatsChange}
        />
      </main>
    </div>
  );
}
