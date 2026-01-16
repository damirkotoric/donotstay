import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization to avoid build-time errors when env vars aren't set
let _supabaseAdmin: SupabaseClient | null = null;
let _supabaseConfigured = true;

function getSupabaseAdmin(): SupabaseClient | null {
  if (_supabaseAdmin) return _supabaseAdmin;
  if (!_supabaseConfigured) return null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase not configured - caching and rate limiting disabled');
    _supabaseConfigured = false;
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _supabaseAdmin = createClient<any>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _supabaseAdmin;
}

// Export getter function - call supabaseAdmin() in API routes
// Returns null if Supabase isn't configured
export function supabaseAdmin(): SupabaseClient | null {
  return getSupabaseAdmin();
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  getSupabaseAdmin(); // Trigger check
  return _supabaseConfigured;
}
