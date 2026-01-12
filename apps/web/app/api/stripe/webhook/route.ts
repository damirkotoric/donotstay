import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
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

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan as 'monthly' | 'annual';

        if (userId && plan) {
          // Get subscription details
          const subscription = await stripe().subscriptions.retrieve(
            session.subscription as string
          );

          await supabaseAdmin()
            .from('users')
            .update({
              subscription_status: plan,
              subscription_ends_at: new Date(
                subscription.current_period_end * 1000
              ).toISOString(),
            })
            .eq('id', userId);

          console.log(`Subscription activated for user ${userId}: ${plan}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const { data: userData } = await supabaseAdmin()
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (userData) {
          const status = subscription.status;
          const periodEnd = new Date(subscription.current_period_end * 1000);

          if (status === 'active') {
            // Determine plan from price
            const priceId = subscription.items.data[0]?.price.id;
            const plan = priceId === process.env.STRIPE_PRICE_ANNUAL ? 'annual' : 'monthly';

            await supabaseAdmin()
              .from('users')
              .update({
                subscription_status: plan,
                subscription_ends_at: periodEnd.toISOString(),
              })
              .eq('id', userData.id);
          } else if (status === 'past_due' || status === 'unpaid') {
            // Keep current plan but note the issue
            console.log(`Subscription past due for user ${userData.id}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const { data: userData } = await supabaseAdmin()
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (userData) {
          await supabaseAdmin()
            .from('users')
            .update({
              subscription_status: 'free',
              subscription_ends_at: null,
            })
            .eq('id', userData.id);

          console.log(`Subscription cancelled for user ${userData.id}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const { data: userData } = await supabaseAdmin()
          .from('users')
          .select('id, email')
          .eq('stripe_customer_id', customerId)
          .single();

        if (userData) {
          console.log(`Payment failed for user ${userData.id} (${userData.email})`);
          // Could send an email notification here
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
