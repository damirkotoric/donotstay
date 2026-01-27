import { Metadata } from 'next';
import { Check } from '@phosphor-icons/react/dist/ssr';
import { LogoFull, LogoFullDark } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Welcome - DoNotStay',
  description: 'DoNotStay is now installed. Get your first hotel verdict.',
};

export default function WelcomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-muted gap-6">
      <div className="mb-6 flex justify-center">
        <LogoFull height={32} className="block dark:hidden" />
        <LogoFullDark height={32} className="hidden dark:block" />
      </div>
      <div className="max-w-xl p-8 rounded-xl bg-card shadow-md">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-verdict-stay flex items-center justify-center">
          <Check size={28} weight="bold" className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-foreground">
          You're all set!
        </h1>
        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
          DoNotStay is now installed. Visit any hotel on Booking.com to run your first check.
        </p>
        <video
          src="/welcome.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="rounded-lg mb-6 border"
        />
        <div className="flex flex-col gap-3">
          <Button size="lg" variant="outline" asChild>
            <a
              href={siteConfig.exampleHotelUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Try it now
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
