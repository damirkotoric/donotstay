import { CREDIT_PACKS, ANONYMOUS_TIER_LIMIT, FREE_SIGNUP_CREDITS } from '@donotstay/shared';

export const siteConfig = {
  name: 'DoNotStay',
  tagline: 'Know which hotels to avoid before you book',
  chromeWebStoreUrl:
    process.env.NEXT_PUBLIC_CHROME_STORE_URL ||
    'https://chrome.google.com/webstore/detail/donotstay/YOUR_EXTENSION_ID',
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
