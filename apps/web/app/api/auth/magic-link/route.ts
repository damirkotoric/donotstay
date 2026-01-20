import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { MagicLinkRequest, ApiError } from '@donotstay/shared';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest) {
  try {
    const body: MagicLinkRequest = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid email address', code: 'INVALID_EMAIL' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json<ApiError>(
        { error: 'Database not configured', code: 'DB_NOT_CONFIGURED' },
        { status: 503, headers: corsHeaders }
      );
    }

    // Send OTP code (not magic link) by omitting emailRedirectTo
    const { error } = await supabase.auth.signInWithOtp({
      email,
    });

    if (error) {
      console.error('OTP send error:', error);
      return NextResponse.json<ApiError>(
        { error: 'Failed to send verification code', code: 'OTP_SEND_ERROR' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Check your email for the 6-digit code' },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json<ApiError>(
      { error: 'Failed to send verification code', code: 'OTP_SEND_ERROR' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}
