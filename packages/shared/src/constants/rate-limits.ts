// Anonymous tier (checks before signup prompt)
export const ANONYMOUS_TIER_LIMIT = 5;

// Free authenticated tier (total credits on signup)
export const FREE_SIGNUP_CREDITS = 10;

// Credit pack definitions
export const CREDIT_PACKS = {
  entry: { credits: 15, priceCents: 999, priceDisplay: 'USD $9.99' },
  standard: { credits: 50, priceCents: 1999, priceDisplay: 'USD $19.99' },
  traveler: { credits: 150, priceCents: 3999, priceDisplay: 'USD $39.99' },
} as const;

export type CreditPackType = keyof typeof CREDIT_PACKS;
