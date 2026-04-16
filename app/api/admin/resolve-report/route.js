// app/api/admin/resolve-report/route.js
import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Note: Local auth bypass may be enabled via SKIP_AUTH in middleware for development only.
// Remove/disable that bypass before merging to shared branches.

if (!process.env.DATABASE_URL) {
  console.error('resolve-report startup check: DATABASE_URL is missing. Set it in .env.local and restart the dev server.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // optional: ssl: { rejectUnauthorized: false } if your DB requires it
});

export async function POST(req) {
  if (!process.env.DATABASE_URL) {
    console.error('resolve-report server error', {
      message: 'DATABASE_URL is missing',
      stack: new Error('DATABASE_URL missing').stack
    });
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  }

  let body;

  try {
    body = await req.json();
  } catch (err) {
    console.error('resolve-report invalid JSON body', {
      message: err?.message,
      stack: err?.stack
    });
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
  }

  const { reportId, resolverId, resolutionNote } = body ?? {};

  if (!reportId || !resolverId) {
    return NextResponse.json(
      { error: 'missing required fields: reportId and resolverId' },
      { status: 400 }
    );
  }

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    const updateRes = await client.query(
      `UPDATE public.user_reports
       SET status = $1, resolution_note = $2, resolved_at = now()
       WHERE id = $3
       RETURNING id`,
      ['resolved', resolutionNote ?? 'Resolved via API', reportId]
    );

    if (updateRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'report not found' }, { status: 404 });
    }

    await client.query(
      `INSERT INTO public.user_activity_logs
       (user_id, action_type, metadata, created_at, actor_id, action, object_type, object_id)
       VALUES ($1,$2,$3,now(),$4,$5,$6,$7)`,
      [
        resolverId,
        'report_resolved',
        JSON.stringify({
          note: resolutionNote ?? 'Resolved via API',
          object_type: 'user_report',
          object_id: reportId
        }),
        resolverId,
        'report_resolved',
        'user_report',
        reportId
      ]
    );

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    console.error('resolve-report server error', {
      message: err?.message,
      stack: err?.stack
    });
    return NextResponse.json({ error: 'internal server error' }, { status: 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
