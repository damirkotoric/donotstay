'use client';

import { Check } from '@phosphor-icons/react';
import { siteConfig } from '@/lib/config';
import { Button } from '@/components/ui/button';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'For casual trips',
    features: [
      `${siteConfig.pricing.free.checksPerWindow} checks per ${siteConfig.pricing.free.windowHours === 1 ? 'hour' : `${siteConfig.pricing.free.windowHours} hours`}`,
      'Verdict + confidence score',
      'Top red flags only',
    ],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: `$${siteConfig.pricing.pro.monthlyPrice}`,
    period: '/month',
    description: 'For frequent travelers & planners',
    features: [
      'Unlimited checks',
      'Full red flag breakdown',
      'All personas',
      'Follow-up questions (coming next)',
      `Annual: $${siteConfig.pricing.pro.annualPrice}/year (save 17%)`,
    ],
    cta: 'Upgrade to Pro',
    highlighted: true,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="px-4 py-30 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Simple Pricing
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Start free, upgrade when you need more.
          </p>
        </div>

        <div className="grid items-center gap-8 md:grid-cols-2">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-2xl p-8 ${
                plan.highlighted
                  ? 'relative bg-gradient-to-br from-primary to-primary-dark text-white shadow-xl ring-4 ring-primary/20'
                  : 'border border-border bg-background'
              }`}
            >
              {/* {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-background px-4 py-1 text-sm font-semibold text-primary shadow-md">
                  Most Popular
                </div>
              )} */}
              <h3
                className={`text-xl font-semibold ${
                  plan.highlighted ? 'text-white' : 'text-foreground'
                }`}
              >
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span
                  className={`ml-1 ${
                    plan.highlighted ? 'text-white/80' : 'text-muted-foreground'
                  }`}
                >
                  {plan.period}
                </span>
              </div>
              <p
                className={`mt-2 ${
                  plan.highlighted ? 'text-white/80' : 'text-muted-foreground'
                }`}
              >
                {plan.description}
              </p>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check
                      size={20}
                      weight="bold"
                      className={`flex-shrink-0 ${
                        plan.highlighted ? 'text-white' : 'text-primary'
                      }`}
                    />
                    <span
                      className={
                        plan.highlighted ? 'text-white/90' : 'text-muted-foreground'
                      }
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.highlighted ? 'secondary' : 'outline'}
                className="mt-8 w-full"
                size="xl"
                asChild
              >
                <a
                  href={siteConfig.chromeWebStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {plan.cta}
                </a>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
