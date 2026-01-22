import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiError } from '@donotstay/shared';
import { FREE_SIGNUP_CREDITS } from '@donotstay/shared';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const type = searchParams.get('type');

    if (!token) {
      return NextResponse.json<ApiError>(
        { error: 'Missing token', code: 'MISSING_TOKEN' },
        { status: 400 }
      );
    }

    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json<ApiError>(
        { error: 'Database not configured', code: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    // Verify the OTP token
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type === 'recovery' ? 'recovery' : 'email',
    });

    if (error || !data.session || !data.user) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 400 }
      );
    }

    const user = data.user;

    // Ensure user exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingUser) {
      await supabase.from('users').insert({
        id: user.id,
        email: user.email!,
        subscription_status: 'free',
        credits_remaining: FREE_SIGNUP_CREDITS,
      });
    }

    // Return session token for the extension to store
    return NextResponse.json({
      success: true,
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json<ApiError>(
      { error: 'Failed to verify token', code: 'VERIFY_ERROR' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
