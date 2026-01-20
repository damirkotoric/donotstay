import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { CREDIT_PACKS, type CreditPackType } from '@donotstay/shared';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe().webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const supabase = supabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const packType = session.metadata?.pack_type as CreditPackType | undefined;

        // Handle credit pack purchase (one-time payment)
        if (userId && packType && CREDIT_PACKS[packType]) {
          const pack = CREDIT_PACKS[packType];

          // Add credits using atomic function
          const { data: newBalance, error: rpcError } = await supabase.rpc('add_credits', {
            user_uuid: userId,
            amount: pack.credits,
          });

          if (rpcError) {
            console.error('Error adding credits:', rpcError);
            return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
          }

          // Record purchase in credit_purchases table
          const { error: insertError } = await supabase.from('credit_purchases').insert({
            user_id: userId,
            stripe_payment_intent_id: session.payment_intent as string,
            pack_type: packType,
            credits_amount: pack.credits,
            amount_paid_cents: pack.priceCents,
          });

          if (insertError) {
            console.error('Error recording purchase:', insertError);
            // Credits were already added, so continue
          }

          console.log(`Credits added for user ${userId}: +${pack.credits} (new balance: ${newBalance})`);
        }
        break;
      }

      // Note: Subscription-related events are no longer needed with the credit system
      // Keeping as comments for reference during migration

      // case 'customer.subscription.updated':
      // case 'customer.subscription.deleted':
      // case 'invoice.payment_failed':
      //   // These events were for subscription management
      //   // No longer needed with credit pack purchases
      //   break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
