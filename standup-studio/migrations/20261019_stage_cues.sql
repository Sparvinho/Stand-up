-- Kör i Supabase SQL Editor efter att ha tagit backup. Additiv, ingen befintlig data tas bort.
ALTER TABLE public.bits
  ADD COLUMN IF NOT EXISTS stage_cues text NOT NULL DEFAULT '';

ALTER TABLE public.setlists
  ADD COLUMN IF NOT EXISTS cue_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.bits.stage_cues IS 'Grundstödord för skämtet i biblioteket.';
COMMENT ON COLUMN public.setlists.cue_overrides IS 'Stödord frysta per skämt-id och setlist. Värdet kan vara tom sträng.';
