import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ANONYMOUS_TIER_LIMIT } from '@donotstay/shared';
import type { ApiError } from '@donotstay/shared';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface ClaimRequest {
  device_id: string;
}

export async function POST(request: NextRequest) {
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

    const body: ClaimRequest = await request.json();
    const { device_id } = body;

    if (!device_id) {
      return NextResponse.json<ApiError>(
        { error: 'Missing device_id', code: 'MISSING_DEVICE_ID' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if this device was already claimed
    const { data: existingClaim } = await supabase
      .from('anonymous_claims')
      .select('id')
      .eq('device_id', device_id)
      .single();

    if (existingClaim) {
      // Already claimed - return success but don't add credits again
      return NextResponse.json({
        success: true,
        already_claimed: true,
        credits_added: 0,
      }, { headers: corsHeaders });
    }

    // Count how many anonymous checks this device has used
    const { count: checksUsed } = await supabase
      .from('anonymous_checks')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', device_id);

    // Calculate remaining anonymous credits
    const remainingAnonymous = Math.max(0, ANONYMOUS_TIER_LIMIT - (checksUsed || 0));

    // Add remaining anonymous credits to user's account
    if (remainingAnonymous > 0) {
      const { error: updateError } = await supabase.rpc('increment_credits', {
        user_id_param: user.id,
        amount: remainingAnonymous,
      });

      // If RPC doesn't exist, fall back to manual increment
      if (updateError) {
        const { data: userData } = await supabase
          .from('users')
          .select('credits_remaining')
          .eq('id', user.id)
          .single();

        const newCredits = (userData?.credits_remaining || 0) + remainingAnonymous;

        await supabase
          .from('users')
          .update({ credits_remaining: newCredits })
          .eq('id', user.id);
      }
    }

    // Record the claim to prevent double-claiming
    await supabase
      .from('anonymous_claims')
      .insert({
        device_id,
        user_id: user.id,
        credits_claimed: remainingAnonymous,
      });

    return NextResponse.json({
      success: true,
      already_claimed: false,
      credits_added: remainingAnonymous,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error claiming anonymous credits:', error);
    return NextResponse.json<ApiError>(
      { error: 'Failed to claim credits', code: 'CLAIM_ERROR' },
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
