// middleware.ts
import { type NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { updateSession } from './src/utils/supabase/middleware';

export async function middleware(request: NextRequest) {
  // If the request targets an API route, call updateSession and ensure API clients
  // get JSON 401 instead of an HTML redirect when unauthenticated.
  if (request.nextUrl.pathname.startsWith('/api')) {
    try {
      const res = await updateSession(request);
      // If updateSession returns a Response that is a redirect, convert it to JSON 401
      if (res instanceof Response && res.status >= 300 && res.status < 400) {
        return new NextResponse(JSON.stringify({ error: 'unauthenticated' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return res;
    } catch (err) {
      return new NextResponse(JSON.stringify({ error: 'unauthenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // For non-API requests, keep existing behavior (pages can still redirect to /login)
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
