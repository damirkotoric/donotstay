'use client';

import { PuzzlePiece, MagnifyingGlass, CheckCircle, CaretRight, CaretDown } from '@phosphor-icons/react';

const steps = [
  {
    icon: PuzzlePiece,
    title: 'Step 1: Install extension',
    description: 'Add DoNotStay via the Chrome Web Store.',
  },
  {
    icon: MagnifyingGlass,
    title: '2. Browse hotel page',
    description: 'Visit Booking.com hotel pages as you normally would.',
  },
  {
    icon: CheckCircle,
    title: '3. Click for instant verdict',
    description: "See what's wrong — and whether you should book.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="container mx-auto max-w-6xl rounded-xl bg-background border shadow-sm px-4 py-12 sm:px-6 lg:px-8 z-1 relative">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
          {steps.map((step, index) => (
            <div key={index} className="contents flex items-center">
              <div className="flex gap-4 flex-1">
                <div className="flex-shrink-0">
                  <step.icon className="w-8 h-8 text-foreground" weight="duotone" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-foreground-secondary text-sm">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex justify-center md:items-center p-2 md:py-0">
                  <CaretDown className="w-5 h-5 text-muted-foreground md:hidden" weight="bold" />
                  <CaretRight className="w-5 h-5 text-muted-foreground hidden md:block" weight="bold" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
