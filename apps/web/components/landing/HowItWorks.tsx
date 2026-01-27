'use client';

import { PuzzlePiece, MagnifyingGlass, CheckCircle, CaretRight, CaretDown } from '@phosphor-icons/react';
import { siteConfig } from '@/lib/config';

const steps = [
  {
    icon: PuzzlePiece,
    title: 'Step 1: Install extension',
    description: 'Add DoNotStay via the Chrome Web Store.',
    link: { text: 'Install now.', href: siteConfig.chromeWebStoreUrl },
  },
  {
    icon: MagnifyingGlass,
    title: '2. Browse hotel page',
    description: 'Visit any Booking.com hotel page as you normally would.',
    link: { text: 'Try one.', href: siteConfig.exampleHotelUrl },
  },
  {
    icon: CheckCircle,
    title: '3. Get instant verdict',
    description: "Click \"Check\" to see what's wrong — and whether you should book.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative z-1 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-xl border bg-background p-6 shadow-sm sm:p-8">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-4">
          {steps.map((step, index) => (
            <div key={index} className="contents">
              <div className="flex w-full gap-4 md:flex-1">
                <div className="flex-shrink-0">
                  <step.icon className="h-8 w-8 text-foreground" weight="duotone" />
                </div>
                <div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                    {'link' in step && step.link && (
                      <>
                        {' '}
                        <a
                          href={step.link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-foreground underline underline-offset-4 hover:text-foreground/80"
                        >
                          {step.link.text}
                        </a>
                      </>
                    )}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <>
                  <CaretDown className="my-2 h-5 w-5 text-muted-foreground md:hidden" weight="bold" />
                  <CaretRight className="hidden h-5 w-5 flex-shrink-0 text-muted-foreground md:block" weight="bold" />
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
