// Admin section layout — wraps all /admin/* pages with the shared AdminLayout component
import AdminLayout from '@/components/admin/AdminLayout';

export const metadata = {
  title: 'SyncLiving Admin',
  description: 'SyncLiving administration panel',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
