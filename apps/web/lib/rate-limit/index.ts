import { supabaseAdmin } from '../supabase';
import { ANONYMOUS_TIER_LIMIT } from '@donotstay/shared';
import type { UserTier } from '@donotstay/shared';

export interface RateLimitResult {
  allowed: boolean;
  credits_remaining: number;
  tier: UserTier;
  requires_signup: boolean;
  requires_purchase: boolean;
}

/**
 * Check rate limit for a user based on their tier
 * No more subscription checks - uses credit system
 */
export async function checkRateLimit(
  userId: string | null,
  deviceId: string | null
): Promise<RateLimitResult> {
  // Authenticated users - check credits
  if (userId) {
    return checkAuthenticatedCredits(userId);
  }

  // Anonymous users - check device limit
  if (deviceId) {
    return checkAnonymousLimit(deviceId);
  }

  // No identity at all - deny
  return {
    allowed: false,
    credits_remaining: 0,
    tier: 'anonymous',
    requires_signup: true,
    requires_purchase: false,
  };
}

/**
 * Check credits for authenticated users
 */
async function checkAuthenticatedCredits(userId: string): Promise<RateLimitResult> {
  const client = supabaseAdmin();

  if (!client) {
    // Fail closed - deny if Supabase unavailable
    console.error('Rate limit check failed: Supabase not configured');
    return {
      allowed: false,
      credits_remaining: 0,
      tier: 'authenticated',
      requires_signup: false,
      requires_purchase: false,
    };
  }

  const { data: userData, error: userError } = await client
    .from('users')
    .select('credits_remaining')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    console.error('Error fetching user credits:', userError || 'user data not found');
    // Fail closed - deny on error or missing user
    return {
      allowed: false,
      credits_remaining: 0,
      tier: 'authenticated',
      requires_signup: false,
      requires_purchase: false,
    };
  }

  const credits = userData.credits_remaining ?? 0;

  return {
    allowed: credits > 0,
    credits_remaining: credits,
    tier: 'authenticated',
    requires_signup: false,
    requires_purchase: credits === 0,
  };
}

/**
 * Check rate limit for anonymous users (limit of 3 checks)
 */
async function checkAnonymousLimit(deviceId: string): Promise<RateLimitResult> {
  const client = supabaseAdmin();

  if (!client) {
    // Fail closed - deny if Supabase unavailable
    console.error('Rate limit check failed: Supabase not configured');
    return {
      allowed: false,
      credits_remaining: 0,
      tier: 'anonymous',
      requires_signup: true,
      requires_purchase: false,
    };
  }

  // Count TOTAL checks ever made (lifetime limit before signup)
  const { count, error } = await client
    .from('anonymous_checks')
    .select('*', { count: 'exact', head: true })
    .eq('device_id', deviceId);

  if (error || count === null || count === undefined) {
    console.error('Error checking anonymous rate limit:', error || 'count returned null/undefined');
    // Fail closed - deny on error or unexpected response
    return {
      allowed: false,
      credits_remaining: 0,
      tier: 'anonymous',
      requires_signup: true,
      requires_purchase: false,
    };
  }

  const checksUsed = count;
  const remaining = Math.max(0, ANONYMOUS_TIER_LIMIT - checksUsed);

  return {
    allowed: remaining > 0,
    credits_remaining: remaining,
    tier: 'anonymous',
    requires_signup: remaining === 0,
    requires_purchase: false,
  };
}

/**
 * Record a check for an anonymous user
 */
export async function recordAnonymousCheck(deviceId: string, hotelId: string): Promise<void> {
  const client = supabaseAdmin();
  if (!client) return;

  const { error } = await client.from('anonymous_checks').insert({
    device_id: deviceId,
    hotel_id: hotelId,
  });

  if (error) {
    console.error('Error recording anonymous check:', error);
  }
}

/**
 * Consume a credit for an authenticated user (atomic operation)
 * Returns true if credit was consumed, false if no credits available
 */
export async function consumeCredit(userId: string, hotelId: string): Promise<boolean> {
  const client = supabaseAdmin();
  if (!client) {
    console.error('Cannot consume credit: Supabase not configured');
    return false; // Fail closed
  }

  // Use atomic function to prevent race conditions
  const { data: newBalance, error: rpcError } = await client.rpc('decrement_credit', {
    user_uuid: userId,
  });

  if (rpcError) {
    console.error('Error decrementing credit:', rpcError);
    return false;
  }

  // -1 indicates no credits were available
  if (newBalance < 0) {
    return false;
  }

  // Record the check for history/analytics
  const { error: insertError } = await client.from('checks').insert({
    user_id: userId,
    hotel_id: hotelId,
  });

  if (insertError) {
    console.error('Error recording check:', insertError);
    // Credit was already consumed, continue anyway
  }

  return true;
}

/**
 * Check if a user has previously checked a specific hotel
 * Used for showing cached verdicts without counting against rate limit
 */
export async function hasUserCheckedHotel(
  userId: string | null,
  deviceId: string | null,
  hotelId: string
): Promise<boolean> {
  const client = supabaseAdmin();
  if (!client) return false;

  if (userId) {
    const { data } = await client
      .from('checks')
      .select('id')
      .eq('user_id', userId)
      .eq('hotel_id', hotelId)
      .limit(1);

    return (data?.length ?? 0) > 0;
  }

  if (deviceId) {
    const { data } = await client
      .from('anonymous_checks')
      .select('id')
      .eq('device_id', deviceId)
      .eq('hotel_id', hotelId)
      .limit(1);

    return (data?.length ?? 0) > 0;
  }

  return false;
}

/**
 * Check if a user has ever purchased credits
 * Used to determine if results should be blurred
 */
export async function hasUserPurchased(userId: string | null): Promise<boolean> {
  if (!userId) return false;

  const client = supabaseAdmin();
  if (!client) return false;

  const { data: hasPurchased, error } = await client.rpc('has_user_purchased', {
    user_uuid: userId,
  });

  if (error) {
    console.error('Error checking purchase status:', error);
    return false;
  }

  return hasPurchased === true;
}

/**
 * Get the count of anonymous checks used (for UI display)
 */
export async function getAnonymousChecksUsed(deviceId: string): Promise<number> {
  const client = supabaseAdmin();
  if (!client) return 0;

  const { count } = await client
    .from('anonymous_checks')
    .select('*', { count: 'exact', head: true })
    .eq('device_id', deviceId);

  return count || 0;
}

/**
 * Get user's current credit balance
 */
export async function getUserCredits(userId: string): Promise<number> {
  const client = supabaseAdmin();
  if (!client) return 0;

  const { data, error } = await client
    .from('users')
    .select('credits_remaining')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user credits:', error);
    return 0;
  }

  return data?.credits_remaining ?? 0;
}
