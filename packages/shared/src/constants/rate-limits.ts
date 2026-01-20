// Anonymous tier (checks before signup prompt)
export const ANONYMOUS_TIER_LIMIT = 3;

// Free authenticated tier (total credits on signup)
export const FREE_SIGNUP_CREDITS = 5;

// Credit pack definitions
export const CREDIT_PACKS = {
  entry: { credits: 10, priceCents: 999, priceDisplay: '$9.99 USD' },
  standard: { credits: 30, priceCents: 1999, priceDisplay: '$19.99 USD' },
  traveler: { credits: 100, priceCents: 3999, priceDisplay: '$39.99 USD' },
} as const;

export type CreditPackType = keyof typeof CREDIT_PACKS;
