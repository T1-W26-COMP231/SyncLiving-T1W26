import { NextResponse } from 'next/server';
import { Pool } from 'pg';

if (!process.env.DATABASE_URL) {
  console.error('health startup check: DATABASE_URL is missing. Set it in .env.local and restart the dev server.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  if (!process.env.DATABASE_URL) {
    console.error('health check DB error', {
      message: 'DATABASE_URL is missing',
      stack: new Error('DATABASE_URL missing').stack,
    });
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }

  let client;

  try {
    client = await pool.connect();
    await client.query('SELECT 1');
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error('health check DB error', {
      message: err?.message,
      stack: err?.stack,
    });
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
