'use client';

import React, { useState } from 'react';
import {
  CheckCircle,
  UserPlus,
  Bold,
  Italic,
  Paperclip,
  Smile,
  Send,
  Megaphone,
  Link2,
  List,
  Code2,
  Rocket,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  sender: 'user' | 'admin' | 'system';
  text: string;
  time: string;
  initials: string;
}

// ─── Mock conversation ────────────────────────────────────────────────────────
const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    sender: 'system',
    text: 'Today, 10:45 AM',
    time: '',
    initials: '',
  },
  {
    id: '2',
    sender: 'user',
    initials: 'SS',
    text: "Hi, I'm trying to upgrade my account but every time I click 'Confirm Payment' it says 'An error occurred'. I've tried two different cards. Can you help?",
    time: '10:46 AM',
  },
  {
    id: '3',
    sender: 'system',
    text: 'Admin Agent (You) joined the conversation.',
    time: '',
    initials: '',
  },
  {
    id: '4',
    sender: 'admin',
    initials: 'ME',
    text: "Hello Sarah! I'm sorry to hear you're having trouble. Let me check our payment processor logs for your account. One moment please.",
    time: '10:48 AM',
  },
  {
    id: '5',
    sender: 'user',
    initials: 'SS',
    text: "Thanks! I'm using a Visa card ending in 4242.",
    time: '10:49 AM',
  },
];

// ─── Broadcast history ────────────────────────────────────────────────────────
const RECENT_BROADCASTS = [
  { title: 'New Platform Rules Update', meta: 'Published 2 days ago • Reach: 14.2k', live: true },
  { title: 'Winter Holidays Event', meta: 'Published 1 week ago • Reach: 11.8k', live: false },
];

type AudienceTarget = 'All Users' | 'Seekers' | 'Providers';

export default function SupportTickets() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [replyText, setReplyText] = useState('');
  const [resolved, setResolved] = useState(false);

  // Broadcast form state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [audience, setAudience] = useState<AudienceTarget>('All Users');
  const [sendPush, setSendPush] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [broadcasts, setBroadcasts] = useState(RECENT_BROADCASTS);
  const [published, setPublished] = useState(false);

  function sendMessage() {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [
      ...prev,
      { id: String(Date.now()), sender: 'admin', initials: 'ME', text: trimmed, time: now },
    ]);
    setReplyText('');
  }

  function handlePublish() {
    if (!broadcastTitle.trim()) return;
    setBroadcasts((prev) => [
      { title: broadcastTitle, meta: `Published just now • Audience: ${audience}`, live: true },
      ...prev,
    ]);
    setBroadcastTitle('');
    setBroadcastContent('');
    setPublished(true);
    setTimeout(() => setPublished(false), 3000);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Page Header */}
      <div className="px-6 py-5 bg-white border-b border-slate-200 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Support &amp; Broadcast</h1>
        <p className="text-slate-500 text-sm mt-0.5">Respond to user tickets and publish platform announcements.</p>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Center Panel: Active Ticket Conversation */}
        <section className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
          {/* Chat Header */}
          <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-admin-primary/20 flex items-center justify-center text-admin-primary font-bold text-sm">
                SS
              </div>
              <div>
                <h4 className="text-sm font-bold leading-none">Sarah Smith</h4>
                <span className="text-[11px] text-slate-400">
                  sarah.smith@example.com • User since Jan 2024
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-colors">
                <UserPlus className="w-4 h-4" /> Assign
              </button>
              {!resolved ? (
                <button
                  onClick={() => setResolved(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-admin-primary text-white text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  <CheckCircle className="w-4 h-4" /> Resolve &amp; Close
                </button>
              ) : (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-600 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" /> Resolved
                </span>
              )}
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) => {
              // System date separator
              if (msg.sender === 'system' && msg.id === '1') {
                return (
                  <div key={msg.id} className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                );
              }
              // System join notice
              if (msg.sender === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-admin-primary/5 text-admin-primary text-[11px] font-medium px-4 py-1.5 rounded-xl border border-admin-primary/20 italic">
                      {msg.text}
                    </div>
                  </div>
                );
              }
              // Admin message (right-aligned)
              if (msg.sender === 'admin') {
                return (
                  <div key={msg.id} className="flex gap-3 max-w-[80%] ml-auto flex-row-reverse">
                    <div className="size-8 rounded-full bg-admin-primary shrink-0 flex items-center justify-center text-white text-[10px] font-bold">
                      {msg.initials}
                    </div>
                    <div className="bg-admin-primary text-white p-4 rounded-xl rounded-tr-none shadow-sm">
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <span className="text-[10px] mt-2 block opacity-80">{msg.time}</span>
                    </div>
                  </div>
                );
              }
              // User message (left-aligned)
              return (
                <div key={msg.id} className="flex gap-3 max-w-[80%]">
                  <div className="size-8 rounded-full bg-slate-200 shrink-0 flex items-center justify-center text-slate-500 text-xs font-bold">
                    {msg.initials}
                  </div>
                  <div className="bg-white p-4 rounded-xl rounded-tl-none border border-slate-200 shadow-sm">
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] text-slate-400 mt-2 block">{msg.time}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Response field */}
          {!resolved && (
            <div className="p-4 bg-white border-t border-slate-200">
              <div className="rounded-xl border border-slate-200 p-2 focus-within:ring-2 focus-within:ring-admin-primary/20 focus-within:border-admin-primary transition-all">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendMessage();
                  }}
                  className="w-full border-none bg-transparent focus:ring-0 focus:outline-none text-sm resize-none h-24 placeholder:text-slate-400"
                  placeholder="Type your response here... (Ctrl+Enter to send)"
                />
                <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-1">
                  <div className="flex gap-1">
                    <button className="p-1.5 text-slate-400 hover:text-admin-primary transition-colors">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-admin-primary transition-colors">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-admin-primary transition-colors">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 text-slate-400 hover:text-admin-primary transition-colors">
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!replyText.trim()}
                    className="bg-admin-primary text-white text-xs font-bold px-5 py-2 rounded-full hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-admin-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Message <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Right Panel: Broadcast Center */}
        <aside className="w-96 border-l border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto">
          <div className="p-6">
            {/* Broadcast Center header */}
            <div className="flex items-center gap-2 mb-6">
              <Megaphone className="w-5 h-5 text-admin-primary" />
              <h3 className="font-bold text-lg">Broadcast Center</h3>
            </div>

            <div className="space-y-5">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Announcement Title
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Scheduled Maintenance"
                  className="w-full rounded-xl border border-slate-200 bg-transparent text-sm focus:border-admin-primary focus:ring-1 focus:ring-admin-primary/20 focus:outline-none px-3 py-2"
                />
              </div>

              {/* Audience */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Target Audience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['All Users', 'Seekers', 'Providers'] as AudienceTarget[]).map((a) => (
                    <button
                      key={a}
                      onClick={() => setAudience(a)}
                      className={`py-2 text-[11px] font-bold rounded-full border transition-colors ${
                        audience === a
                          ? 'border-admin-primary bg-admin-primary text-white'
                          : 'border-slate-200 text-slate-500 hover:border-admin-primary'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Content
                </label>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-2 py-1 border-b border-slate-200 flex gap-1">
                    <button className="p-1 text-slate-400 hover:text-admin-primary transition-colors">
                      <Bold className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-slate-400 hover:text-admin-primary transition-colors">
                      <Italic className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-slate-400 hover:text-admin-primary transition-colors">
                      <List className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-slate-400 hover:text-admin-primary transition-colors">
                      <Link2 className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-slate-400 hover:text-admin-primary transition-colors ml-auto">
                      <Code2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    className="w-full border-none bg-transparent focus:ring-0 focus:outline-none text-sm h-48 resize-none placeholder:text-slate-400 p-3"
                    placeholder="Write announcement details..."
                  />
                </div>
              </div>

              {/* Options */}
              <div className="pt-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendPush}
                    onChange={(e) => setSendPush(e.target.checked)}
                    className="rounded-xl text-admin-primary focus:ring-admin-primary/20 size-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-600">Send push notification</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="rounded-xl text-admin-primary focus:ring-admin-primary/20 size-4 cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-600">Send as high-priority email</span>
                </label>
              </div>

              {/* Publish / Draft */}
              <div className="pt-6 border-t border-slate-100">
                <button
                  onClick={handlePublish}
                  disabled={!broadcastTitle.trim()}
                  className="w-full bg-admin-primary text-white font-bold py-3 rounded-full shadow-lg shadow-admin-primary/30 hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Rocket className="w-4 h-4" />
                  {published ? 'Published!' : 'Publish Now'}
                </button>
                <button className="w-full text-slate-500 text-xs font-bold py-3 mt-2 hover:text-slate-700 transition-colors">
                  Save Draft &amp; Close
                </button>
              </div>
            </div>

            {/* Recent Broadcasts */}
            <div className="mt-12">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Recent Broadcasts
              </h4>
              <div className="space-y-4">
                {broadcasts.map((b, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div
                      className={`size-2 rounded-full mt-1.5 shrink-0 ${
                        b.live ? 'bg-green-500' : 'bg-slate-300'
                      }`}
                    />
                    <div>
                      <p className="text-xs font-bold">{b.title}</p>
                      <p className="text-[10px] text-slate-400">{b.meta}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
