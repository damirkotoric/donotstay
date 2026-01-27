import { CREDIT_PACKS, ANONYMOUS_TIER_LIMIT, FREE_SIGNUP_CREDITS } from '@donotstay/shared';

export const siteConfig = {
  name: 'DoNotStay',
  tagline: 'Know which hotels to avoid before you book',
  chromeWebStoreUrl:
    process.env.NEXT_PUBLIC_CHROME_STORE_URL ||
    'https://chromewebstore.google.com/detail/donotstay/hpcibhenhfikfdlegphjecnhepomieea',
  exampleHotelUrl: 'https://www.booking.com/hotel/jp/wan-fu-lou.en-gb.html',
  pricing: {
    free: {
      name: 'Free',
      anonymousChecks: ANONYMOUS_TIER_LIMIT,
      signupCredits: FREE_SIGNUP_CREDITS,
    },
    creditPacks: CREDIT_PACKS,
  },
  links: {
    howItWorks: '#how-it-works',
    pricing: '#pricing',
    faq: '#faq',
  },
} as const;
