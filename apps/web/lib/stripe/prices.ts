export const PRICES = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  annual: process.env.STRIPE_PRICE_ANNUAL!,
};

export const PLAN_NAMES = {
  monthly: 'Pro Monthly',
  annual: 'Pro Annual',
};
