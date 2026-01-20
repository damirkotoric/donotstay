import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';
import { CREDIT_PACKS } from '@donotstay/shared';
import type { CreditPurchaseRequest, CreditPurchaseResponse, ApiError, CreditPackType } from '@donotstay/shared';

// Stripe price IDs for each credit pack
const STRIPE_PRICES: Record<CreditPackType, string> = {
  entry: process.env.STRIPE_PRICE_ENTRY!,
  standard: process.env.STRIPE_PRICE_STANDARD!,
  traveler: process.env.STRIPE_PRICE_TRAVELER!,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

    const body: CreditPurchaseRequest = await request.json();
    const { pack_type } = body;

    // Validate pack type
    if (!pack_type || !CREDIT_PACKS[pack_type]) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid pack type', code: 'INVALID_PACK' },
        { status: 400, headers: corsHeaders }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Get or create Stripe customer
    let customerId: string;

    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userData?.stripe_customer_id) {
      customerId = userData.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe().customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session for one-time payment using pre-created Stripe prices
    const session = await stripe().checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: STRIPE_PRICES[pack_type],
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      metadata: {
        user_id: user.id,
        pack_type,
      },
    });

    const response: CreditPurchaseResponse = {
      checkout_url: session.url!,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json<ApiError>(
      { error: 'Failed to create checkout session', code: 'CHECKOUT_ERROR' },
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
