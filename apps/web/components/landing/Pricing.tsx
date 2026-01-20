'use client';

import { Check, Star } from '@phosphor-icons/react';
import { siteConfig } from '@/lib/config';
import { Button } from '@/components/ui/button';

const creditPacks = [
  {
    key: 'entry' as const,
    name: 'Entry Pack',
    credits: siteConfig.pricing.creditPacks.entry.credits,
    price: siteConfig.pricing.creditPacks.entry.priceDisplay,
    pricePerCheck: '$1.00',
    description: 'Try it out',
    highlighted: false,
  },
  {
    key: 'standard' as const,
    name: 'Standard Pack',
    credits: siteConfig.pricing.creditPacks.standard.credits,
    price: siteConfig.pricing.creditPacks.standard.priceDisplay,
    pricePerCheck: '$0.67',
    description: 'Popular',
    highlighted: false,
  },
  {
    key: 'traveler' as const,
    name: 'Traveler Pack',
    credits: siteConfig.pricing.creditPacks.traveler.credits,
    price: siteConfig.pricing.creditPacks.traveler.priceDisplay,
    pricePerCheck: '$0.40',
    description: 'For frequent travelers',
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="px-4 py-30 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Simple Credit Packs
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Pay once, use anytime. Credits never expire.
          </p>
        </div>

        {/* Free tier callout */}
        <div className="flex flex-col items-center space-y-2 mb-12 text-center">
          <div className="flex items-center gap-2">
            <Check size={20} weight="bold" />
            <span className="font-medium">
              Start with {siteConfig.pricing.free.anonymousChecks} free checks — no account needed
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Check size={20} weight="bold" />
            <span className="font-medium">
              Get {siteConfig.pricing.free.signupCredits} more checks if you create a free account
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Then, purchase credit packs as needed below.
          </p>
        </div>

        <div className="grid items-stretch gap-6 md:grid-cols-3">
          {creditPacks.map((pack) => (
            <div
              key={pack.key}
              className={`relative flex flex-col rounded-2xl p-8 ${
                pack.highlighted
                  ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-xl ring-4 ring-primary/20'
                  : 'border border-border bg-background'
              }`}
            >
              {pack.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-background px-4 py-1 text-sm font-semibold text-primary shadow-md">
                  <Star size={14} weight="fill" />
                  Best Value
                </div>
              )}

              <h3
                className={`text-xl font-semibold ${
                  pack.highlighted ? 'text-white' : 'text-foreground'
                }`}
              >
                {pack.name}
              </h3>

              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold">{pack.credits}</span>
                <span
                  className={`ml-2 ${
                    pack.highlighted ? 'text-white/80' : 'text-muted-foreground'
                  }`}
                >
                  checks
                </span>
              </div>

              <div className="mt-2">
                <span className={`text-2xl font-semibold ${
                  pack.highlighted ? 'text-white' : 'text-foreground'
                }`}>
                  {pack.price}
                </span>
                <span
                  className={`ml-2 text-sm ${
                    pack.highlighted ? 'text-white/70' : 'text-muted-foreground'
                  }`}
                >
                  ({pack.pricePerCheck}/check)
                </span>
              </div>

              <p
                className={`mt-2 ${
                  pack.highlighted ? 'text-white/80' : 'text-muted-foreground'
                }`}
              >
                {pack.description}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                <li className="flex items-start gap-3">
                  <Check
                    size={20}
                    weight="bold"
                    className={`flex-shrink-0 ${
                      pack.highlighted ? 'text-white' : 'text-primary'
                    }`}
                  />
                  <span
                    className={
                      pack.highlighted ? 'text-white/90' : 'text-muted-foreground'
                    }
                  >
                    Full red flag breakdown
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check
                    size={20}
                    weight="bold"
                    className={`flex-shrink-0 ${
                      pack.highlighted ? 'text-white' : 'text-primary'
                    }`}
                  />
                  <span
                    className={
                      pack.highlighted ? 'text-white/90' : 'text-muted-foreground'
                    }
                  >
                    All personas
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Check
                    size={20}
                    weight="bold"
                    className={`flex-shrink-0 ${
                      pack.highlighted ? 'text-white' : 'text-primary'
                    }`}
                  />
                  <span
                    className={
                      pack.highlighted ? 'text-white/90' : 'text-muted-foreground'
                    }
                  >
                    Credits never expire
                  </span>
                </li>
              </ul>

              <Button
                variant={pack.highlighted ? 'secondary' : 'outline'}
                className="mt-8 w-full"
                size="xl"
                asChild
              >
                <a
                  href={siteConfig.chromeWebStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get {pack.credits} Checks
                </a>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          All purchases are one-time payments. No subscriptions. Credits never expire.
        </p>
      </div>
    </section>
  );
}
