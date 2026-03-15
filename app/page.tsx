import { createClient } from '@/src/utils/supabase/server'

export default async function Home() {
  // Initialize the Supabase client for Server Components
  const supabase = await createClient()

  // Fetch the current user session
  // This is handled on the server side before the page is sent to the browser
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1>Supabase Connection Test</h1>
      
      <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Login Status</h2>
        {user ? (
          <div>
            <p style={{ color: 'green' }}>✅ You are logged in!</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </div>
        ) : (
          <div>
            <p style={{ color: 'orange' }}>⚠️ Not logged in.</p>
            <p>Please check your <code>.env.local</code> settings or try to log in once you have an auth flow set up.</p>
          </div>
        )}
      </div>

      <section style={{ marginTop: '2rem' }}>
        <h3>How it works:</h3>
        <ul>
          <li>This page is a <strong>Server Component</strong>.</li>
          <li>It uses <code>src/utils/supabase/server.ts</code> to securely check authentication.</li>
          <li>The <code>middleware.ts</code> ensures your session stays active while you browse.</li>
        </ul>
      </section>
    </main>
  )
}
