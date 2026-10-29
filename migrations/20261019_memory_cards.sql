-- Minneslappar per setlist, utan ändringar i befintliga skämt.
ALTER TABLE public.setlists ADD COLUMN IF NOT EXISTS memory_cards jsonb NOT NULL DEFAULT '[]'::jsonb;
