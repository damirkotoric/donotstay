import { NextRequest, NextResponse } from 'next/server';
import { getAnonymousChecksUsed } from '@/lib/rate-limit';
import { ANONYMOUS_TIER_LIMIT } from '@donotstay/shared';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Device-ID',
};

interface AnonymousStatusResponse {
  device_id: string;
  checks_used: number;
  checks_remaining: number;
  limit: number;
}

/**
 * Get anonymous user status (check count) from server
 * This is the source of truth for anonymous rate limiting
 */
export async function GET(request: NextRequest) {
  try {
    const deviceId = request.headers.get('X-Device-ID');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Missing X-Device-ID header' },
        { status: 400, headers: corsHeaders }
      );
    }

    const checksUsed = await getAnonymousChecksUsed(deviceId);
    const checksRemaining = Math.max(0, ANONYMOUS_TIER_LIMIT - checksUsed);

    const response: AnonymousStatusResponse = {
      device_id: deviceId,
      checks_used: checksUsed,
      checks_remaining: checksRemaining,
      limit: ANONYMOUS_TIER_LIMIT,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Error getting anonymous status:', error);
    return NextResponse.json(
      { error: 'Failed to get anonymous status' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
