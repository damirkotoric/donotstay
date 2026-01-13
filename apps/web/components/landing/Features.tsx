'use client';

import {
  WarningCircle,
  Quotes,
  ChartBar,
  Lightning,
  ShieldCheck,
  Sparkle,
} from '@phosphor-icons/react';

const features = [
  {
    icon: WarningCircle,
    title: 'Red Flag Detection',
    description:
      'Identifies critical issues like cleanliness problems, noise, or hidden fees.',
  },
  // {
  //   icon: Users,
  //   title: '"Avoid if you are..." Personas',
  //   description:
  //     'Know if this hotel suits families, business travelers, or couples.',
  // },
  {
    icon: Quotes,
    title: 'Real Evidence',
    description:
      'Every red flag links back to actual guest quotes. No AI guesswork.',
  },
  {
    icon: ChartBar,
    title: 'Confidence Score',
    description:
      'See how confident our AI is based on review quantity and consistency.',
  },
  {
    icon: Lightning,
    title: 'Instant Analysis',
    description:
      'Get results in seconds, not minutes of manual review reading.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy First',
    description:
      'No tracking, no data selling. Your browsing stays private.',
  },
  {
    icon: Sparkle,
    title: 'One-liner Summary',
    description:
      'Get the essence of what guests think in a single sentence.',
  },
];

export function Features() {
  return (
    <section className="bg-background-subtle border border-t px-4 py-30 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Ease of Mind
          </h2>
          <p className="mt-4 text-xl text-foreground-secondary">
            Make bookings with confidence.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-foreground/5 text-foreground">
                  <feature.icon size={24} weight="bold" />
                </div>
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-foreground-secondary">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-foreground-muted">
          Free users see verdict + top flags. Paid unlocks everything.
        </p>
      </div>
    </section>
  );
}
