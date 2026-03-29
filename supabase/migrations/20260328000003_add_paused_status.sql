-- Add 'paused' value to the post_status enum so providers can temporarily hide listings
ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'paused';
