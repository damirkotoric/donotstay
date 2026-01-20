import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserVerdict, getAnonymousVerdict } from '@/lib/cache/user-verdicts';
import type { VerdictResult } from '@donotstay/shared';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Device-ID',
};

interface CheckCacheResponse {
  cached: boolean;
  verdict_data?: VerdictResult;
  analyzed_at?: string;
}

/**
 * Check if the current user has a cached verdict for a specific hotel
 * Per-user caching - each user's checks are independent
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const hotelId = url.searchParams.get('hotel_id');

    if (!hotelId) {
      return NextResponse.json(
        { error: 'Missing hotel_id parameter' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get user from auth header or device ID
    const authHeader = request.headers.get('Authorization');
    const deviceId = request.headers.get('X-Device-ID');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const supabase = supabaseAdmin();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      }
    }

    // Check for user-specific cached verdict
    let cached = null;

    if (userId) {
      cached = await getUserVerdict(userId, hotelId);
    } else if (deviceId) {
      cached = await getAnonymousVerdict(deviceId, hotelId);
    }

    if (cached && cached.verdict) {
      const verdictData: VerdictResult = {
        verdict: cached.verdict,
        confidence: cached.confidence,
        one_liner: cached.one_liner,
        red_flags: cached.red_flags,
        avoid_if_you_are: cached.avoid_if_you_are,
        bottom_line: cached.bottom_line,
        cached: true,
      };
      const response: CheckCacheResponse = {
        cached: true,
        verdict_data: verdictData,
        analyzed_at: cached.created_at,
      };
      return NextResponse.json(response, { headers: corsHeaders });
    }

    // No cache found for this user
    const response: CheckCacheResponse = {
      cached: false,
    };
    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Error checking cache:', error);
    return NextResponse.json(
      { error: 'Failed to check cache' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
