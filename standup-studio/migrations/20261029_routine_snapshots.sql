-- Backup first. Keep a snapshot of Writer routines in each setlist.
ALTER TABLE public.setlists ADD COLUMN IF NOT EXISTS routine_snapshots jsonb NOT NULL DEFAULT '{}'::jsonb;
