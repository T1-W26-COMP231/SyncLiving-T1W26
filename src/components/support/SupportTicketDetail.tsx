"use client";

import React, { useState, useTransition, useRef, useEffect } from "react";
import { 
  ArrowLeft, 
  Send, 
  User, 
  Clock, 
  ShieldCheck,
  Archive,
  Loader2,
  LifeBuoy
} from "lucide-react";
import Link from "next/link";
import { sendTicketMessage } from "../../../app/support/actions";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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
  subject: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  messages: Message[];
}

export default function UserSupportTicketDetail({ ticket }: { ticket: Ticket }) {
  const [reply, setReply] = useState("");
  const [isPending, startTransition] = useTransition();
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
        await sendTicketMessage(ticket.id, reply);
        setReply("");
        router.refresh();
      } catch (error) {
        alert("Failed to send reply. Please try again.");
      }
    });
  };

  const statusColors = {
    open: "text-emerald-600 bg-emerald-50 border-emerald-100",
    in_progress: "text-amber-600 bg-amber-50 border-amber-100",
    closed: "text-slate-500 bg-slate-50 border-slate-100",
  };

  const isClosed = ticket.status === "closed";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab="Support" />
      
      <main className="flex-1 flex flex-col">
        {/* ── Header ── */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Link 
              href="/support"
              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-black text-dark">{ticket.subject}</h1>
                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${statusColors[ticket.status]}`}>
                  {ticket.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-[11px] text-slate-500 font-medium">
                 <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.created_at).toLocaleString()}</span>
                 <span className="capitalize">Priority: {ticket.priority}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Chat Content ── */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 max-w-4xl mx-auto w-full">
          {ticket.messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 ${msg.senderRole === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`size-9 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  msg.senderRole === "admin" ? "bg-primary text-dark" : "bg-slate-200 text-slate-500"
              }`}>
                {msg.senderRole === "admin" ? <ShieldCheck size={18} /> : msg.senderName.charAt(0)}
              </div>
              <div className={`flex-1 ${msg.senderRole === "user" ? "text-right" : ""}`}>
                 <div className={`flex items-center gap-2 mb-1.5 ${msg.senderRole === "user" ? "justify-end" : ""}`}>
                    {msg.senderRole === "admin" && <span className="text-[10px] font-black text-primary uppercase tracking-tight">SyncLiving Support</span>}
                    <span className="text-[10px] font-black text-dark uppercase tracking-tight">{msg.senderName}</span>
                    <span className="text-[9px] font-medium text-slate-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                 </div>
                 <div className={`inline-block text-left px-5 py-3 rounded-3xl shadow-sm text-sm leading-relaxed ${
                   msg.senderRole === "user" 
                     ? "bg-primary text-dark rounded-tr-none" 
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
        <div className="bg-white border-t border-slate-200 p-6 sticky bottom-0">
          <div className="max-w-4xl mx-auto">
            {isClosed ? (
              <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
                <Archive size={18} />
                <p className="text-sm font-bold">This ticket is closed. Please create a new ticket if you still need help.</p>
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="flex gap-3">
                <div className="flex-1 relative">
                  <textarea 
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Type your message..."
                    rows={1}
                    className="w-full px-5 py-3 bg-slate-100 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none min-h-[48px] max-h-[150px]"
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
                  className="size-12 bg-primary text-dark rounded-xl flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none shrink-0"
                >
                  {isPending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
