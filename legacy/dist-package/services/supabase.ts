
import { createClient } from '@supabase/supabase-js';

// NOTE: In a real app, these should be in .env files.
// Since we are in a demo environment, we check if they exist.
// If you want to connect your real Supabase, replace these strings or set process.env.
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_ANON_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export const isSupabaseConfigured = () => !!supabase;
