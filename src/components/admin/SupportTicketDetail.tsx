"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { 
  ArrowLeft, 
  Send, 
  CheckCircle2, 
  User, 
  Clock, 
  AlertCircle,
  ShieldCheck,
  Archive,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { sendTicketResponse, closeTicket } from "../../../app/admin/actions";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "admin" | "user";
  content: string;
  createdAt: string;
}

interface Ticket {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export default function SupportTicketDetail({ ticket }: { ticket: Ticket }) {
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isClosing, startClosingTransition] = useTransition();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket.messages]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || isPending) return;

    startTransition(async () => {
      try {
        await sendTicketResponse(ticket.id, reply);
        setReply("");
        router.refresh();
      } catch (error) {
        alert("Failed to send reply. Please try again.");
      }
    });
  };

  const handleCloseTicket = async () => {
    if (!confirm("Are you sure you want to close this ticket? This action is permanent.")) return;

    startClosingTransition(async () => {
      try {
        await closeTicket(ticket.id);
        router.refresh();
      } catch (error) {
        alert("Failed to close ticket. Please try again.");
      }
    });
  };

  const statusColors = {
    open: "text-emerald-600 bg-emerald-50 border-emerald-100",
    in_progress: "text-amber-600 bg-amber-50 border-amber-100",
    closed: "text-slate-500 bg-slate-50 border-slate-100",
  };

  const priorityColors = {
    low: "text-slate-500 bg-slate-50",
    medium: "text-amber-600 bg-amber-50",
    high: "text-rose-600 bg-rose-50 font-bold",
  };

  const isClosed = ticket.status === "closed";

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-50">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <Link 
            href="/admin/support"
            className="p-2.5 text-slate-400 hover:text-admin-primary hover:bg-admin-primary/5 rounded-2xl transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900">{ticket.subject}</h1>
              <span className={`px-3 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${statusColors[ticket.status]}`}>
                {ticket.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <User size={14} className="text-slate-400" /> {ticket.userName}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Clock size={14} className="text-slate-400" /> {new Date(ticket.createdAt).toLocaleString()}
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border border-transparent text-[10px] font-black uppercase tracking-wider ${priorityColors[ticket.priority]}`}>
                <AlertCircle size={10} /> {ticket.priority} Priority
              </div>
            </div>
          </div>
        </div>

        {!isClosed && (
          <button 
            onClick={handleCloseTicket}
            disabled={isClosing}
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm disabled:opacity-50"
          >
            {isClosing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
            Close Ticket
          </button>
        )}
      </div>

      {/* ── Chat Content ── */}
      <div className="flex-1 overflow-y-auto px-8 py-10 space-y-10">
        {/* Message History */}
        {ticket.messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 max-w-4xl mx-auto ${msg.senderRole === "admin" ? "flex-row-reverse" : ""}`}
          >
            <div className={`size-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                msg.senderRole === "admin" ? "bg-admin-primary text-white" : "bg-slate-200 text-slate-500"
            }`}>
              {msg.senderName.charAt(0)}
            </div>
            <div className={`flex-1 ${msg.senderRole === "admin" ? "text-right" : ""}`}>
               <div className={`flex items-center gap-2 mb-2 ${msg.senderRole === "admin" ? "justify-end" : ""}`}>
                  {msg.senderRole === "admin" && <ShieldCheck size={12} className="text-admin-primary" />}
                  <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{msg.senderName}</span>
                  <span className="text-[10px] font-medium text-slate-400">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>
               <div className={`inline-block text-left px-6 py-4 rounded-[2rem] shadow-sm text-sm leading-relaxed ${
                 msg.senderRole === "admin" 
                   ? "bg-admin-primary text-white rounded-tr-none" 
                   : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
               }`}>
                  {msg.content}
               </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Footer / Reply Form ── */}
      <div className="bg-white border-t border-slate-200 p-8 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          {isClosed ? (
            <div className="flex items-center justify-center gap-3 p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 text-slate-400">
              <Archive size={20} />
              <p className="font-bold">This ticket was closed and is now read-only.</p>
            </div>
          ) : (
            <form onSubmit={handleSendReply} className="flex gap-4">
              <div className="flex-1 relative">
                <textarea 
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type your response to the user..."
                  rows={1}
                  className="w-full px-6 py-4 bg-slate-100 border-none rounded-3xl text-sm focus:ring-2 focus:ring-admin-primary/20 outline-none transition-all resize-none min-h-[56px] max-h-[200px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply(e);
                    }
                  }}
                />
              </div>
              <button 
                type="submit"
                disabled={!reply.trim() || isPending}
                className="size-14 bg-admin-primary text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-admin-primary/20 disabled:opacity-50 disabled:shadow-none shrink-0"
              >
                {isPending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
