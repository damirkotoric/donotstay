'use client';

import { useEffect, useRef, useState } from 'react';
import { siteConfig } from '@/lib/config';
import { FlipWords } from '@/components/ui/flip-words';
import { BookingLogo } from '@/components/logos';
import { Button } from '@/components/ui/button';

const rotatingWords = ['mold', 'thin walls', 'rude staff', 'noise', 'bedbugs', 'weak AC'];

export function Hero() {
  const imageRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(20);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    const stiffness = 0.03;
    const damping = 0.7;

    let currentRotation = 20;
    let currentOpacity = 0;
    let targetRotation = 20;
    let rotationVelocity = 0;
    let opacityVelocity = 0;
    let frame: number;
    let hasStarted = false;
    let isAnimating = false;

    const getScrollTarget = () => {
      if (!imageRef.current) return 20;
      const rect = imageRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const progress = Math.max(0, Math.min(1, (windowHeight - rect.top) / (windowHeight * 0.6)));
      return 20 * (1 - progress);
    };

    const animate = () => {
      isAnimating = true;

      // Rotation spring
      const rotDisplacement = targetRotation - currentRotation;
      rotationVelocity += rotDisplacement * stiffness;
      rotationVelocity *= damping;
      currentRotation += rotationVelocity;
      setRotation(currentRotation);

      // Opacity spring (fades to 1 once, then stays)
      if (currentOpacity < 0.999) {
        const opDisplacement = 1 - currentOpacity;
        opacityVelocity += opDisplacement * stiffness;
        opacityVelocity *= damping;
        currentOpacity = Math.max(0, Math.min(1, currentOpacity + opacityVelocity));
        setOpacity(currentOpacity);
      }

      // Stop animating once settled
      const isSettled =
        Math.abs(rotationVelocity) < 0.001 &&
        Math.abs(rotDisplacement) < 0.01 &&
        currentOpacity >= 0.999;

      if (isSettled) {
        isAnimating = false;
      } else {
        frame = requestAnimationFrame(animate);
      }
    };

    const handleScroll = () => {
      if (!hasStarted) return;
      targetRotation = getScrollTarget();
      // Restart animation if it stopped
      if (!isAnimating) {
        frame = requestAnimationFrame(animate);
      }
    };

    // After delay: start both animations together, listen to scroll
    const delayTimeout = setTimeout(() => {
      hasStarted = true;
      targetRotation = getScrollTarget();
      window.addEventListener('scroll', handleScroll, { passive: true });
      frame = requestAnimationFrame(animate);
    }, 500);

    return () => {
      clearTimeout(delayTimeout);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(frame);
    };
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
            className="overflow-hidden bg-gradient-to-br from-white/10 to-muted rounded-xl shadow-2xl border p-2"
            style={{ transform: `rotateX(${rotation}deg)`, opacity }}
          >
            <div className="max-h-[800px] bg-white border rounded-lg overflow-hidden">
              <img
                src="/gallery-1.jpg"
                alt="DoNotStay extension showing hotel review analysis"
                width={2500}
                height={2500}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
