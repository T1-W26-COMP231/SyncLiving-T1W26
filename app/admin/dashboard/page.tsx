// Admin Dashboard page — renders the AdminDashboard client component
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata = {
  title: 'Dashboard — SyncLiving Admin',
};

export default function DashboardPage() {
  return <AdminDashboard />;
}
