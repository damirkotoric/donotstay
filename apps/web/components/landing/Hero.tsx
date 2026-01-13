'use client';

import { siteConfig } from '@/lib/config';
import { FlipWords } from '@/components/ui/flip-words';
import { BookingLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';

const rotatingWords = ['mold', 'thin walls', 'rude staff', 'noise', 'bedbugs', 'weak AC'];

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-background-subtle to-background px-4 pt-40 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Text content - left side */}
          <div>
            <h1 className="text-4xl font-bold leading-none text-foreground sm:text-5xl lg:text-6xl">
              Find out about the
              <FlipWords words={rotatingWords} className="text-primary" />{' '}
              before you book.
            </h1>
            <p className="mt-4 text-xl text-foreground-secondary">
              We read the reviews. You get the verdict.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button size="xl" asChild>
                <a
                  href={siteConfig.chromeWebStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Add to Chrome — It&apos;s FREE
                </a>
              </Button>
            </div>
            <p className="mt-2 text-xs text-foreground-muted">
              Free tier: {siteConfig.pricing.free.checksPerWindow} checks every{' '}
              {siteConfig.pricing.free.windowHours === 1 ? 'hour' : `${siteConfig.pricing.free.windowHours} hours`}
            </p>
            <div className="mt-8">
              <p className="mb-2 text-xs text-foreground-muted uppercase font-semibold">Works with</p>
              <div className="mb-1.5 flex items-center gap-6">
                <BookingLogo className="h-8 w-auto" />
              </div>
              <p className="text-xs text-foreground-muted">Airbnb and Expedia coming next</p>
            </div>
          </div>

          {/* Image placeholder - right side */}
          <div className="relative">
            <div className="flex aspect-[1/1] items-center justify-center rounded-2xl bg-background-muted shadow-lg">
              <div className="p-8 text-center">
                <div className="mb-4 text-6xl">🏨</div>
                <span className="text-foreground-subtle">
                  Extension screenshot placeholder
                </span>
              </div>
            </div>
            {/* Decorative elements */}
            <div className="absolute -right-4 -bottom-4 -z-10 h-full w-full rounded-2xl bg-primary/10" />
          </div>
        </div>
      </div>
    </section>
  );
}
