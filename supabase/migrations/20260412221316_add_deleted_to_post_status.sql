-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block (Postgres restriction).
-- The Supabase CLI pragma below disables the implicit transaction wrapper for this file.
-- supabase.disable-transaction: true

ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'deleted';
