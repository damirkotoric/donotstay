import { supabaseAdmin } from '../supabase';
import { createCacheKey, VERDICT_CACHE_TTL_MS } from '@donotstay/shared';
import type { VerdictResponse } from '../claude';

export interface CachedVerdict extends VerdictResponse {
  id: string;
  hotel_id: string;
  review_count: number;
  created_at: string;
  expires_at: string;
}

export async function getCachedVerdict(hotelUrl: string): Promise<CachedVerdict | null> {
  const client = supabaseAdmin();
  if (!client) return null; // Supabase not configured

  const cacheKey = createCacheKey(hotelUrl);

  const { data, error } = await client
    .from('verdicts')
    .select('*')
    .eq('hotel_id', cacheKey)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    hotel_id: data.hotel_id,
    verdict: data.verdict as VerdictResponse['verdict'],
    confidence: data.confidence,
    one_liner: data.one_liner,
    red_flags: data.red_flags as VerdictResponse['red_flags'],
    avoid_if_you_are: data.avoid_if as VerdictResponse['avoid_if_you_are'],
    bottom_line: data.bottom_line,
    review_count: data.review_count,
    created_at: data.created_at,
    expires_at: data.expires_at,
  };
}

export async function cacheVerdict(
  hotelUrl: string,
  verdict: VerdictResponse,
  reviewCount: number
): Promise<string | null> {
  const client = supabaseAdmin();
  if (!client) return null; // Supabase not configured

  const cacheKey = createCacheKey(hotelUrl);
  const expiresAt = new Date(Date.now() + VERDICT_CACHE_TTL_MS);

  const { data, error } = await client
    .from('verdicts')
    .upsert({
      hotel_id: cacheKey,
      platform: 'booking.com',
      verdict: verdict.verdict,
      confidence: verdict.confidence,
      one_liner: verdict.one_liner,
      red_flags: verdict.red_flags,
      avoid_if: verdict.avoid_if_you_are,
      bottom_line: verdict.bottom_line,
      review_count: reviewCount,
      expires_at: expiresAt.toISOString(),
    }, {
      onConflict: 'hotel_id',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error caching verdict:', error);
    return null;
  }

  return data.id;
}
