'use client';

import { siteConfig } from '@/lib/config';
import { FlipWords } from '@/components/ui/flip-words';

const rotatingWords = ['mold', 'thin walls', 'rude staff', 'noise', 'bedbugs', 'broken AC'];

export function Hero() {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white px-4 pt-24 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 md:grid-cols-2">
          {/* Text content - left side */}
          <div>
            <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Find out about the
              <FlipWords words={rotatingWords} className="text-primary" />{' '}
              before you book.
            </h1>
            <p className="mt-6 text-xl text-gray-600">
              We read the reviews. You get the verdict.
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <a
                href={siteConfig.chromeWebStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-center text-lg"
              >
                Add to Chrome — It&apos;s Free
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Free tier: {siteConfig.pricing.free.checksPerWindow} checks every{' '}
              {siteConfig.pricing.free.windowHours === 1 ? 'hour' : `${siteConfig.pricing.free.windowHours} hours`}
            </p>
          </div>

          {/* Image placeholder - right side */}
          <div className="relative">
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gray-100 shadow-lg">
              <div className="p-8 text-center">
                <div className="mb-4 text-6xl">🏨</div>
                <span className="text-gray-400">
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
