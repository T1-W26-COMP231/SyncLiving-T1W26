import AdminLayout from '@/components/admin/AdminLayout';
import { getSupportTickets } from '../actions';
import Link from 'next/link';
import { 
  MessageSquare, 
  Clock, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';

export const metadata = {
  title: 'Support Tickets | SyncLiving Admin',
  description: 'Manage and respond to user support requests.',
};

export default async function SupportPage() {
  const tickets = await getSupportTickets();

  const statusColors = {
    open: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    in_progress: 'text-amber-600 bg-amber-50 border-amber-100',
    closed: 'text-slate-500 bg-slate-50 border-slate-100',
  };

  const priorityColors = {
    low: 'text-slate-500 bg-slate-50',
    medium: 'text-amber-600 bg-amber-50',
    high: 'text-rose-600 bg-rose-50',
  };

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Support Tickets</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage and respond to user inquiries.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
           <div className="px-4 py-2 bg-admin-primary/10 rounded-xl">
             <span className="text-admin-primary font-black text-sm">{tickets.length} ACTIVE</span>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subject</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Priority</th>
                <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Updated</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold text-sm line-clamp-1">{ticket.subject}</span>
                        <span className="text-slate-400 text-[10px] font-medium mt-0.5 uppercase tracking-wider">{ticket.id.substring(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs overflow-hidden">
                          {ticket.userAvatar ? (
                              <img src={ticket.userAvatar} alt="" className="size-full object-cover" />
                          ) : (
                              ticket.userName.charAt(0)
                          )}
                        </div>
                        <span className="text-slate-600 font-bold text-xs">{ticket.userName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusColors[ticket.status as keyof typeof statusColors]}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border border-transparent w-fit ${priorityColors[ticket.priority as keyof typeof priorityColors]}`}>
                          <AlertCircle size={10} />
                          <span className="text-[10px] font-black uppercase tracking-wider">{ticket.priority}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2 text-slate-500 font-medium text-xs">
                        <Clock size={14} className="text-slate-300" />
                        {new Date(ticket.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link 
                        href={`/admin/support/${ticket.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black hover:bg-admin-primary hover:text-white hover:border-admin-primary transition-all group-hover:shadow-lg group-hover:shadow-admin-primary/10"
                      >
                        Details
                        <ChevronRight size={14} />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                        <MessageSquare size={40} />
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold">No active tickets</p>
                        <p className="text-slate-400 text-sm">Everything is caught up!</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
