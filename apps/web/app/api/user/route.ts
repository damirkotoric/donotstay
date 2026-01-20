import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { hasUserPurchased } from '@/lib/rate-limit';
import { FREE_SIGNUP_CREDITS } from '@donotstay/shared';
import type { UserInfo, ApiError } from '@donotstay/shared';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiError>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.slice(7);
    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json<ApiError>(
        { error: 'Database not configured', code: 'DB_NOT_CONFIGURED' },
        { status: 503, headers: corsHeaders }
      );
    }
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401, headers: corsHeaders }
      );
    }

    // Get user data from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, credits_remaining')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      // User authenticated but not in our table yet - create entry with default credits
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          credits_remaining: FREE_SIGNUP_CREDITS,
        })
        .select('id, email, credits_remaining')
        .single();

      if (createError || !newUser) {
        return NextResponse.json<ApiError>(
          { error: 'Failed to create user', code: 'USER_CREATE_ERROR' },
          { status: 500, headers: corsHeaders }
        );
      }

      const response: UserInfo = {
        id: newUser.id,
        email: newUser.email,
        credits_remaining: newUser.credits_remaining,
        has_purchased: false,
      };

      return NextResponse.json(response, { headers: corsHeaders });
    }

    // Check if user has ever purchased credits
    const hasPurchased = await hasUserPurchased(user.id);

    const response: UserInfo = {
      id: userData.id,
      email: userData.email,
      credits_remaining: userData.credits_remaining,
      has_purchased: hasPurchased,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Error getting user:', error);
    return NextResponse.json<ApiError>(
      { error: 'Failed to get user', code: 'USER_ERROR' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
