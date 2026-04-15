import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CreateTicketForm from '@/components/support/CreateTicketForm';
import MyTicketsList from '@/components/support/MyTicketsList';
import { getUserSupportTickets } from './actions';

export const metadata = {
  title: 'Support | SyncLiving',
  description: 'Get help with your SyncLiving account and co-living experience.',
};

export default async function SupportPage() {
  const tickets = await getUserSupportTickets();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar activeTab="Support" />
      
      <main className="flex-1 py-12 px-6">
        <CreateTicketForm />
        <MyTicketsList tickets={tickets} />
      </main>

      <Footer />
    </div>
  );
}
