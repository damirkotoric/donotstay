'use client';

import { useEffect, useRef, useState } from 'react';
import { siteConfig } from '@/lib/config';
import { FlipWords } from '@/components/ui/flip-words';
import { BookingLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';

const rotatingWords = ['mold', 'thin walls', 'rude staff', 'noise', 'bedbugs', 'weak AC'];

export function Hero() {
  const imageRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(10);

  useEffect(() => {
    const handleScroll = () => {
      if (!imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate progress based on element's top position
      const progress = Math.max(0, Math.min(1, 1 - rect.top / windowHeight));

      // Interpolate rotation from 10deg to 0deg
      setRotation(20 * (1 - progress));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="bg-gradient-to-b from-muted to-background px-4 pt-28 lg:pt-40 pb-16 lg:pb-40 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Text content - centered */}
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold leading-none text-foreground sm:text-5xl lg:text-6xl">
            Find out about the&nbsp;
            <FlipWords words={rotatingWords} className="text-primary" />{' '}<br />
            before you book.
          </h1>
          <p className="mt-4 text-xl font-medium text-muted-foreground">
            We read the reviews. You get the verdict.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button variant="default" size="xl" asChild>
              <a
                href={siteConfig.chromeWebStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Add to Chrome — It&apos;s FREE
              </a>
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {siteConfig.pricing.free.anonymousChecks} free checks to start, {siteConfig.pricing.free.signupCredits} more when you sign up
          </p>
          <div className="mt-8 flex flex-col items-center">
            <p className="mb-2 text-xs text-muted-foreground uppercase font-semibold">Works with</p>
            <div className="mb-1.5 flex items-center gap-6">
              <BookingLogo className="h-8 w-auto" />
            </div>
            <p className="text-xs text-muted-foreground">Airbnb and Expedia coming next</p>
          </div>
        </div>

        {/* Screenshot - full width below with 3D perspective */}
        <div ref={imageRef} className="relative mt-16 lg:mt-20" style={{ perspective: '2000px' }}>
          <div
            className="max-h-[800px] overflow-hidden rounded-xl shadow-2xl border transition-transform duration-100 ease-out"
            style={{ transform: `rotateX(${rotation}deg)` }}
          >
            <img
              src="/gallery-1.jpg"
              alt="DoNotStay extension showing hotel review analysis"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
