async function main() {
  if (!process.env.DATABASE_URL && typeof process.loadEnvFile === 'function') {
    process.loadEnvFile('.env.local');
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Add it to .env.local or export it in your terminal session.');
  }

  const { Pool } = await import('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  let client;
  try {
    client = await pool.connect();
    const result = await client.query('SELECT 1 AS ok');
    console.log('DB OK:', result.rows[0]);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

const isDirectRun =
  process.argv[1]?.endsWith('/scripts/db-smoke.js') ||
  process.argv[1]?.endsWith('\\scripts\\db-smoke.js');

if (isDirectRun) {
  main().catch((err) => {
    console.error('DB FAIL:', err);
    process.exitCode = 1;
  });
}
