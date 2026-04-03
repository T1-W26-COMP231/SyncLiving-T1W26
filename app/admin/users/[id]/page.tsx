
import { notFound } from 'next/navigation';
import { getUserFullDetails } from '../../actions';
import AdminUserDetailsPage from '../../../../src/components/admin/AdminUserDetailsPage';
import ErrorDisplay from '../../../../src/components/admin/ErrorDisplay';
import { ShieldAlert } from 'lucide-react';

export default async function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) {
    notFound();
  }

  try {
    const userData = await getUserFullDetails(id);

    if (!userData.profile) {
      notFound();
    }

    return <AdminUserDetailsPage userData={userData} />;
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return (
        <ErrorDisplay
          icon={ShieldAlert}
          message="Access Denied"
          subMessage="You must be an administrator to view this page. Please log in with an admin account."
        />
      );
    }
    // For other errors, you might want to log them and show a generic error page.
    // For now, we'll treat them as a "not found" case.
    console.error('Failed to get user details:', error);
    notFound();
  }
}
