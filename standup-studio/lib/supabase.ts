import { createClient } from '@supabase/supabase-js';

// Hämtar dina hemliga nycklar från .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Skapar själva "kabeln" till din databas
export const supabase = createClient(supabaseUrl, supabaseAnonKey);