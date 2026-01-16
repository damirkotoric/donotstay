import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { MagicLinkRequest, ApiError } from '@donotstay/shared';

export async function POST(request: NextRequest) {
  try {
    const body: MagicLinkRequest = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid email address', code: 'INVALID_EMAIL' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json<ApiError>(
        { error: 'Database not configured', code: 'DB_NOT_CONFIGURED' },
        { status: 503 }
      );
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error('Magic link error:', error);
      return NextResponse.json<ApiError>(
        { error: 'Failed to send magic link', code: 'MAGIC_LINK_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Check your email for the login link' });
  } catch (error) {
    console.error('Error sending magic link:', error);
    return NextResponse.json<ApiError>(
      { error: 'Failed to send magic link', code: 'MAGIC_LINK_ERROR' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
