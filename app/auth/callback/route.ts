import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Handles the OAuth callback from Supabase after social login.
 * Exchanges the auth code for a session and redirects to the app.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Fetch user profile to check if they are an admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (profile?.is_admin) {
          return NextResponse.redirect(`${origin}/admin/dashboard`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could+not+authenticate+with+provider`);
}
