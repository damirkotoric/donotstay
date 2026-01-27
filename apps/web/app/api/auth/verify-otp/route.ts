import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ApiError, VerifyOtpRequest } from '@donotstay/shared';
import { FREE_SIGNUP_CREDITS } from '@donotstay/shared';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function POST(request: NextRequest) {
  try {
    const body: VerifyOtpRequest = await request.json();
    const { email, code } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid email address', code: 'INVALID_EMAIL' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!code || code.length < 6) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid verification code', code: 'INVALID_CODE' },
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

    // Verify the OTP code
    // Note: When using admin client with signInWithOtp, Supabase sends recovery OTPs
    // (as evidenced by recovery_sent_at being populated in auth.users)
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'recovery',
    });

    if (error || !data.session || !data.user) {
      console.error('OTP verify error:', error);
      return NextResponse.json<ApiError>(
        { error: 'Invalid or expired code', code: 'INVALID_CODE' },
        { status: 400, headers: corsHeaders }
      );
    }

    const user = data.user;

    // Check if user exists in our users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, credits_remaining')
      .eq('id', user.id)
      .single();

    const isNewUser = !existingUser;
    let creditsRemaining = existingUser?.credits_remaining ?? FREE_SIGNUP_CREDITS;

    if (isNewUser) {
      // Create new user with signup bonus credits
      const { error: insertError } = await supabase.from('users').insert({
        id: user.id,
        email: user.email!,
        subscription_status: 'free',
        credits_remaining: FREE_SIGNUP_CREDITS,
      });

      if (insertError) {
        console.error('Failed to create user record:', insertError);
        return NextResponse.json<ApiError>(
          { error: 'Failed to create account', code: 'USER_CREATE_ERROR' },
          { status: 500, headers: corsHeaders }
        );
      }
      creditsRemaining = FREE_SIGNUP_CREDITS;
    }
    // Note: Returning users keep their existing credits - no bonus for signing in again

    // Return session token for the extension to store
    const response = NextResponse.json(
      {
        success: true,
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: user.id,
          email: user.email,
        },
        is_new_user: isNewUser,
        credits_remaining: creditsRemaining,
      },
      { headers: corsHeaders }
    );

    // Set session cookie for extension auth sync
    // This allows the extension to check if user is logged in via API
    response.cookies.set('donotstay_session', data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json<ApiError>(
      { error: 'Failed to verify code', code: 'VERIFY_ERROR' },
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
