import { supabaseAdmin } from '../supabase';
import { FREE_TIER_LIMIT, FREE_TIER_WINDOW_MS } from '@donotstay/shared';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset_at: string;
}

export async function checkRateLimit(
  userId: string | null,
  subscriptionStatus: 'free' | 'monthly' | 'annual'
): Promise<RateLimitResult> {
  // Paid users have unlimited access
  if (subscriptionStatus !== 'free') {
    return {
      allowed: true,
      remaining: Infinity,
      reset_at: new Date().toISOString(),
    };
  }

  const client = supabaseAdmin();
  const resetAt = new Date(Date.now() + FREE_TIER_WINDOW_MS);

  // If Supabase not configured, allow unlimited (dev mode)
  if (!client) {
    return {
      allowed: true,
      remaining: FREE_TIER_LIMIT,
      reset_at: resetAt.toISOString(),
    };
  }

  const windowStart = new Date(Date.now() - FREE_TIER_WINDOW_MS);

  // Count recent checks
  const { count, error } = await client
    .from('checks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('checked_at', windowStart.toISOString());

  if (error) {
    console.error('Error checking rate limit:', error);
    // Fail open - allow the request
    return {
      allowed: true,
      remaining: 1,
      reset_at: resetAt.toISOString(),
    };
  }

  const checksUsed = count || 0;
  const remaining = Math.max(0, FREE_TIER_LIMIT - checksUsed);

  return {
    allowed: remaining > 0,
    remaining,
    reset_at: resetAt.toISOString(),
  };
}

export async function recordCheck(userId: string, hotelId: string): Promise<void> {
  const client = supabaseAdmin();
  if (!client) return; // Supabase not configured

  const { error } = await client.from('checks').insert({
    user_id: userId,
    hotel_id: hotelId,
  });

  if (error) {
    console.error('Error recording check:', error);
  }
}
