// scripts/resolve-report.js
async function main() {
  if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile('.env.local');
  }

  const { Pool } = await import('pg');
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Add it to .env.local or export it in your terminal session.');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const reportId = '7bd2530e-7fb0-4c91-90c5-87dab74c56f1';
  const resolverId = '783f8150-03c5-4169-90ec-74ed4de9755c';
  const note = 'Resolved via local API test';
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    const upd = await client.query(
      `UPDATE public.user_reports
       SET status = $1, resolution_note = $2, resolved_at = now()
       WHERE id = $3
       RETURNING id`,
      ['resolved', note, reportId]
    );
    console.log('update rowCount:', upd.rowCount);
    if (upd.rowCount > 0) {
      await client.query(
        `INSERT INTO public.user_activity_logs
         (user_id, action_type, metadata, created_at, actor_id, action, object_type, object_id)
         VALUES ($1,$2,$3,now(),$4,$5,$6,$7)`,
        [
          resolverId,
          'report_resolved',
          JSON.stringify({ note, object_type: 'user_report', object_id: reportId }),
          resolverId,
          'report_resolved',
          'user_report',
          reportId
        ]
      );
      await client.query('COMMIT');
      console.log('DB transaction committed');
    } else {
      await client.query('ROLLBACK');
      console.log('Report not found; rolled back');
    }
  } catch (err) {
    if (client) {
      await client.query('ROLLBACK').catch(() => {});
    }
    console.error('DB error:', err);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

const isDirectRun =
  process.argv[1]?.endsWith('/scripts/resolve-report.js') ||
  process.argv[1]?.endsWith('\\scripts\\resolve-report.js');

if (isDirectRun) {
  main().catch((err) => {
    console.error('Unhandled script error:', err);
    process.exitCode = 1;
  });
}
