import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rate-limit';
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
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      // User authenticated but not in our table yet - create entry
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email!,
          subscription_status: 'free',
        })
        .select()
        .single();

      if (createError || !newUser) {
        return NextResponse.json<ApiError>(
          { error: 'Failed to create user', code: 'USER_CREATE_ERROR' },
          { status: 500, headers: corsHeaders }
        );
      }

      const rateLimit = await checkRateLimit(user.id, 'free');

      const response: UserInfo = {
        id: newUser.id,
        email: newUser.email,
        subscription_status: 'free',
        subscription_ends_at: null,
        rate_limit: {
          remaining: rateLimit.remaining,
          reset_at: rateLimit.reset_at,
          is_paid: false,
        },
      };

      return NextResponse.json(response, { headers: corsHeaders });
    }

    // Get rate limit info
    const rateLimit = await checkRateLimit(user.id, userData.subscription_status);

    const response: UserInfo = {
      id: userData.id,
      email: userData.email,
      subscription_status: userData.subscription_status,
      subscription_ends_at: userData.subscription_ends_at,
      rate_limit: {
        remaining: rateLimit.remaining,
        reset_at: rateLimit.reset_at,
        is_paid: userData.subscription_status !== 'free',
      },
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
