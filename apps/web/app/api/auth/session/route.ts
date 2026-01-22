import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Allow requests from extension (booking.com) and localhost
const allowedOrigins = [
  'https://www.booking.com',
  'http://localhost:3000',
  'https://donotstay.app',
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.some(allowed =>
    origin === allowed || origin.startsWith(allowed)
  ) ? origin : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  try {
    // Read session cookie
    const sessionToken = request.cookies.get('donotstay_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { authenticated: false },
        { headers: corsHeaders }
      );
    }

    // Verify the token is still valid by getting user info
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { authenticated: false, error: 'Database not configured' },
        { status: 503, headers: corsHeaders }
      );
    }

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(sessionToken);

    if (error || !user) {
      // Token is invalid or expired - clear the cookie
      const response = NextResponse.json(
        { authenticated: false },
        { headers: corsHeaders }
      );
      response.cookies.delete('donotstay_session');
      return response;
    }

    // Get user's credits
    const { data: userData } = await supabase
      .from('users')
      .select('credits_remaining')
      .eq('id', user.id)
      .single();

    return NextResponse.json(
      {
        authenticated: true,
        access_token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          credits_remaining: userData?.credits_remaining ?? 0,
        },
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to check session' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin');
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(origin),
  });
}
