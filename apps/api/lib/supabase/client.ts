import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors when env vars aren't set
let _supabase: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _supabase = createClient<any>(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}
