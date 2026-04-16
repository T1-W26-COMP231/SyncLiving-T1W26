'use client';

import React from 'react';
import { MessageSquare, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function MyTicketsList({ tickets }: { tickets: any[] }) {
  if (tickets.length === 0) return null;

  const statusColors: Record<string, string> = {
    open: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    in_progress: 'text-amber-600 bg-amber-50 border-amber-100',
    closed: 'text-slate-500 bg-slate-50 border-slate-100',
  };

  return (
    <div className="max-w-2xl mx-auto mt-12 space-y-6 pb-12">
      <div className="flex items-center gap-2 px-2">
        <MessageSquare size={20} className="text-primary" />
        <h2 className="text-xl font-black text-dark">My Recent Tickets</h2>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Link 
            key={ticket.id} 
            href={`/support/${ticket.id}`}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md hover:border-primary/20 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${ticket.status === 'closed' ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'}`}>
                {ticket.status === 'closed' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
              </div>
              <div>
                <h4 className="font-bold text-dark group-hover:text-primary transition-colors">{ticket.subject}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-black tracking-tighter ${statusColors[ticket.status]}`}>
                    {ticket.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-slate-300 group-hover:text-primary transition-colors">
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">View Messages</span>
              <ChevronRight size={18} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
