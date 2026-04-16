'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  MessageSquare, 
  User, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Send,
  MoreVertical,
  ChevronRight,
  ShieldCheck,
  Archive
} from 'lucide-react';
import { SupportTicket, SupportMessage, TicketStatus, TicketPriority } from '../../../app/admin/support/types';

// Mock Data
const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-1001',
    userId: 'user_1',
    userName: 'Sarah Jenkins',
    subject: 'Cannot upload profile picture',
    description: 'I keep getting an "Error 500" when trying to upload my avatar. I tried both PNG and JPG formats.',
    status: 'open',
    priority: 'medium',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    messages: [
      {
        id: 'msg_1',
        senderName: 'Sarah Jenkins',
        senderRole: 'user',
        content: 'I keep getting an "Error 500" when trying to upload my avatar. I tried both PNG and JPG formats.',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ]
  },
  {
    id: 'TKT-1002',
    userId: 'user_2',
    userName: 'Michael Chen',
    subject: 'Report: Suspicious Listing',
    description: 'The listing at 123 Maple St seems like a scam. They asked for a wire transfer before viewing.',
    status: 'in_progress',
    priority: 'high',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    messages: [
      {
        id: 'msg_2',
        senderName: 'Michael Chen',
        senderRole: 'user',
        content: 'The listing at 123 Maple St seems like a scam. They asked for a wire transfer before viewing.',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'msg_3',
        senderName: 'Admin Alex',
        senderRole: 'admin',
        content: 'Thank you for reporting this. We are investigating the user now. Did they send you any specific contact info?',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      }
    ]
  },
  {
    id: 'TKT-1003',
    userId: 'user_3',
    userName: 'Elena Rodriguez',
    subject: 'Update email address',
    description: 'I want to change my login email to my professional one.',
    status: 'closed',
    priority: 'low',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    messages: [
      {
        id: 'msg_4',
        senderName: 'Elena Rodriguez',
        senderRole: 'user',
        content: 'I want to change my login email to my professional one.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      }
    ]
  }
];

export default function SupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>(MOCK_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(MOCK_TICKETS[0].id);
  const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState<TicketStatus | 'all'>('all');

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);
  const filteredTickets = tickets.filter(t => filterStatus === 'all' || t.status === filterStatus);

  const handleSendMessage = () => {
    if (!replyText.trim() || !selectedTicketId) return;

    const newMessage: SupportMessage = {
      id: `msg_${Date.now()}`,
      senderName: 'Admin', // In real app, get from auth
      senderRole: 'admin',
      content: replyText,
      createdAt: new Date().toISOString(),
    };

    setTickets(prev => prev.map(t => 
      t.id === selectedTicketId 
        ? { ...t, status: 'in_progress' as const, messages: [...t.messages, newMessage] } 
        : t
    ));
    setReplyText('');
  };

  const handleCloseTicket = () => {
    if (!selectedTicketId || !confirm('Are you sure you want to close this ticket?')) return;
    
    setTickets(prev => prev.map(t => 
      t.id === selectedTicketId ? { ...t, status: 'closed' as const } : t
    ));
  };

  const statusColors = {
    open: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    in_progress: 'text-amber-600 bg-amber-50 border-amber-100',
    closed: 'text-slate-500 bg-slate-50 border-slate-100',
  };

  const priorityColors = {
    low: 'text-slate-500',
    medium: 'text-amber-600',
    high: 'text-rose-600 font-bold',
  };

  return (
    <div className="flex h-[calc(100vh-65px)] bg-slate-50 overflow-hidden">
      {/* ── Left Sidebar: Ticket List ── */}
      <div className="w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-lg">Support Inbox</h2>
            <span className="bg-admin-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full">
              {tickets.filter(t => t.status !== 'closed').length} ACTIVE
            </span>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search tickets..."
              className="w-full pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs focus:ring-2 focus:ring-admin-primary/20 outline-none transition-all"
            />
          </div>

          <div className="flex gap-2">
            {(['all', 'open', 'in_progress', 'closed'] as const).map(s => (
              <button 
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  filterStatus === s 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filteredTickets.map(ticket => (
            <button
              key={ticket.id}
              onClick={() => setSelectedTicketId(ticket.id)}
              className={`w-full text-left p-4 transition-all hover:bg-slate-50 relative ${
                selectedTicketId === ticket.id ? 'bg-admin-primary/5 border-l-4 border-admin-primary' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ticket.id}</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h4 className={`text-sm font-bold truncate mb-1 ${selectedTicketId === ticket.id ? 'text-admin-primary' : 'text-slate-800'}`}>
                {ticket.subject}
              </h4>
              <p className="text-xs text-slate-500 line-clamp-1 mb-3">{ticket.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-600">
                    {ticket.userName.charAt(0)}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">{ticket.userName}</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-black tracking-tighter ${statusColors[ticket.status]}`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right Content: Ticket Detail ── */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedTicket ? (
          <>
            {/* Ticket Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-admin-primary/10 rounded-2xl text-admin-primary">
                  <MessageSquare size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-900">{selectedTicket.subject}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase font-black tracking-widest ${statusColors[selectedTicket.status]}`}>
                      {selectedTicket.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-slate-500">
                    <span className="text-xs flex items-center gap-1 font-medium">
                      <User size={12} /> {selectedTicket.userName}
                    </span>
                    <span className="text-xs flex items-center gap-1 font-medium">
                      <Clock size={12} /> Received on {new Date(selectedTicket.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`text-xs flex items-center gap-1 font-bold ${priorityColors[selectedTicket.priority]}`}>
                      <AlertCircle size={12} /> {selectedTicket.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedTicket.status !== 'closed' && (
                  <button 
                    onClick={handleCloseTicket}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all"
                  >
                    <CheckCircle2 size={16} /> Mark as Closed
                  </button>
                )}
                <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-slate-50/50">
              {selectedTicket.messages.map((msg, idx) => (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${msg.senderRole === 'admin' ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {msg.senderRole === 'admin' && <ShieldCheck size={12} className="text-admin-primary" />}
                  </div>
                  <div className={`max-w-2xl px-5 py-4 rounded-3xl shadow-sm text-sm leading-relaxed ${
                    msg.senderRole === 'admin' 
                      ? 'bg-admin-primary text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="p-6 border-t border-slate-100 bg-white">
              {selectedTicket.status === 'closed' ? (
                <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                  <Archive size={18} />
                  <p className="text-sm font-bold">This ticket is closed. Re-open to send new messages.</p>
                </div>
              ) : (
                <div className="flex items-end gap-4">
                  <div className="flex-1 relative">
                    <textarea 
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response to the user..."
                      className="w-full p-4 pr-12 bg-slate-100 border-none rounded-3xl text-sm focus:ring-2 focus:ring-admin-primary/20 outline-none transition-all resize-none min-h-[100px]"
                    />
                    <button className="absolute right-4 bottom-4 p-2 text-slate-400 hover:text-admin-primary transition-colors">
                      <Filter size={18} />
                    </button>
                  </div>
                  <button 
                    onClick={handleSendMessage}
                    disabled={!replyText.trim()}
                    className="mb-1 p-4 bg-admin-primary text-white rounded-2xl hover:opacity-90 transition-all shadow-lg shadow-admin-primary/20 disabled:opacity-50 disabled:shadow-none"
                  >
                    <Send size={20} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="p-6 bg-slate-50 rounded-full">
              <MessageSquare size={48} />
            </div>
            <div className="text-center">
              <h3 className="font-bold text-slate-900 text-lg">No Ticket Selected</h3>
              <p className="text-sm">Select a ticket from the sidebar to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
