'use client';

import type { Tables } from "../../types/supabase";

// Define a more specific type for the userData prop
type Profile = Tables<'profiles'>;
type Listing = Tables<'room_listings'>;
type Connection = Tables<'user_connections'>;
type Review = Tables<'reviews'>;
type ActivityLog = Tables<'user_activity_logs'>;

interface UserData {
  profile: Profile | null;
  listings: Listing[];
  connections: Connection[];
  reviewsGiven: Review[];
  reviewsReceived: Review[];
  activityLogs: ActivityLog[];
}

export default function AdminUserDetailsPage({ userData }: { userData: UserData }) {
  const { profile, listings, connections, reviewsGiven, reviewsReceived, activityLogs } = userData;

  if (!profile) {
    return <div>User not found.</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
        <p className="text-gray-600">Viewing full profile and activity for {profile.full_name || 'N/A'}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column for main content */}
        <main className="lg:col-span-2 space-y-8">
          {/* Activity Logs */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Activity Logs</h2>
            <ul className="space-y-4 max-h-96 overflow-y-auto">
              {activityLogs.map(log => (
                <li key={log.id} className="p-3 bg-gray-50 rounded-md">
                  <p className="font-semibold text-gray-800">{log.action_type}</p>
                  <p className="text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</p>
                  {log.metadata && (
                    <pre className="text-xs text-gray-400 mt-1 bg-gray-100 p-2 rounded">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Other sections like Listings, Reviews can be added here */}
        </main>

        {/* Right column for profile summary */}
        <aside className="space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Profile Summary</h2>
            <div className="space-y-2">
              <p><strong>ID:</strong> {profile.id}</p>
              <p><strong>Full Name:</strong> {profile.full_name}</p>
              <p><strong>Email:</strong> {profile.email}</p>
              <p><strong>Role:</strong> {profile.role}</p>
              <p><strong>Account Status:</strong> {profile.account_status}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
