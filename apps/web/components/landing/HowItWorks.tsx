'use client';

import { PuzzlePiece, MagnifyingGlass, CheckCircle } from '@phosphor-icons/react';

const steps = [
  {
    icon: PuzzlePiece,
    title: 'Install the extension',
    description: 'Add DoNotStay to Chrome in one click.',
  },
  {
    icon: MagnifyingGlass,
    title: 'Browse any hotel on Booking.com',
    description: 'Visit hotel pages as you normally would.',
  },
  {
    icon: CheckCircle,
    title: 'Get instant verdict',
    description: "See what's wrong — and whether you should book.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            How It Works
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <step.icon size={32} weight="bold" />
              </div>
              <h3 className="mb-3 text-xl font-semibold text-gray-900">
                {step.title}
              </h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
