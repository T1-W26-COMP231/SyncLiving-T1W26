// Admin Dashboard page — renders the AdminDashboard client component
import AdminDashboard from '@/components/admin/AdminDashboard';
import { getAdminDashboardOverview } from '../actions';

export const metadata = {
  title: 'Dashboard — SyncLiving Admin',
};

export default async function DashboardPage() {
  const data = await getAdminDashboardOverview();
  return <AdminDashboard initialData={data} />;
}
