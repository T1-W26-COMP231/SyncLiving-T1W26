-- ALTER TYPE ... ADD VALUE cannot run inside a transaction block (Postgres restriction).
-- The Supabase CLI pragma below disables the implicit transaction wrapper for this file.
-- supabase.disable-transaction: true

-- Add 'paused' value to the post_status enum so providers can temporarily hide listings
ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'paused';
