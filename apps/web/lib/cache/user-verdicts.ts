import { supabaseAdmin } from '../supabase';
import type { VerdictResponse } from '../claude';

export interface UserVerdict extends VerdictResponse {
  id: string;
  hotel_id: string;
  hotel_url: string;
  review_count: number;
  created_at: string;
}

/**
 * Get a user's cached verdict for a specific hotel
 */
export async function getUserVerdict(
  userId: string,
  hotelId: string
): Promise<UserVerdict | null> {
  const client = supabaseAdmin();
  if (!client) return null;

  const { data, error } = await client
    .from('user_verdicts')
    .select('*')
    .eq('user_id', userId)
    .eq('hotel_id', hotelId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    hotel_id: data.hotel_id,
    hotel_url: data.hotel_url,
    verdict: data.verdict as VerdictResponse['verdict'],
    confidence: data.confidence,
    one_liner: data.one_liner,
    red_flags: data.red_flags as VerdictResponse['red_flags'],
    avoid_if_you_are: data.avoid_if as VerdictResponse['avoid_if_you_are'],
    bottom_line: data.bottom_line,
    review_count: data.review_count,
    created_at: data.created_at,
  };
}

/**
 * Get an anonymous user's cached verdict for a specific hotel
 */
export async function getAnonymousVerdict(
  deviceId: string,
  hotelId: string
): Promise<UserVerdict | null> {
  const client = supabaseAdmin();
  if (!client) return null;

  const { data, error } = await client
    .from('anonymous_verdicts')
    .select('*')
    .eq('device_id', deviceId)
    .eq('hotel_id', hotelId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    hotel_id: data.hotel_id,
    hotel_url: data.hotel_url,
    verdict: data.verdict as VerdictResponse['verdict'],
    confidence: data.confidence,
    one_liner: data.one_liner,
    red_flags: data.red_flags as VerdictResponse['red_flags'],
    avoid_if_you_are: data.avoid_if as VerdictResponse['avoid_if_you_are'],
    bottom_line: data.bottom_line,
    review_count: data.review_count,
    created_at: data.created_at,
  };
}

/**
 * Save a verdict for an authenticated user
 */
export async function saveUserVerdict(
  userId: string,
  hotelId: string,
  hotelUrl: string,
  verdict: VerdictResponse,
  reviewCount: number
): Promise<string | null> {
  const client = supabaseAdmin();
  if (!client) return null;

  const { data, error } = await client
    .from('user_verdicts')
    .upsert(
      {
        user_id: userId,
        hotel_id: hotelId,
        hotel_url: hotelUrl,
        verdict: verdict.verdict,
        confidence: verdict.confidence,
        one_liner: verdict.one_liner,
        red_flags: verdict.red_flags,
        avoid_if: verdict.avoid_if_you_are,
        bottom_line: verdict.bottom_line,
        review_count: reviewCount,
      },
      {
        onConflict: 'user_id,hotel_id',
      }
    )
    .select('id')
    .single();

  if (error) {
    console.error('Error saving user verdict:', error);
    return null;
  }

  return data.id;
}

/**
 * Save a verdict for an anonymous user
 */
export async function saveAnonymousVerdict(
  deviceId: string,
  hotelId: string,
  hotelUrl: string,
  verdict: VerdictResponse,
  reviewCount: number
): Promise<string | null> {
  const client = supabaseAdmin();
  if (!client) return null;

  const { data, error } = await client
    .from('anonymous_verdicts')
    .upsert(
      {
        device_id: deviceId,
        hotel_id: hotelId,
        hotel_url: hotelUrl,
        verdict: verdict.verdict,
        confidence: verdict.confidence,
        one_liner: verdict.one_liner,
        red_flags: verdict.red_flags,
        avoid_if: verdict.avoid_if_you_are,
        bottom_line: verdict.bottom_line,
        review_count: reviewCount,
      },
      {
        onConflict: 'device_id,hotel_id',
      }
    )
    .select('id')
    .single();

  if (error) {
    console.error('Error saving anonymous verdict:', error);
    return null;
  }

  return data.id;
}
