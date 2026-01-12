import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (!_stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    }
    _stripe = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return _stripe;
}
