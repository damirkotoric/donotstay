export const siteConfig = {
  name: 'DoNotStay',
  tagline: 'Know which hotels to avoid before you book',
  chromeWebStoreUrl:
    process.env.NEXT_PUBLIC_CHROME_STORE_URL ||
    'https://chrome.google.com/webstore/detail/donotstay/YOUR_EXTENSION_ID',
  pricing: {
    free: {
      name: 'Free',
      checksPerWindow: 2,
      windowHours: 1,
    },
    pro: {
      name: 'Pro',
      monthlyPrice: 5,
      annualPrice: 50,
    },
  },
  links: {
    howItWorks: '#how-it-works',
    pricing: '#pricing',
    faq: '#faq',
  },
} as const;
