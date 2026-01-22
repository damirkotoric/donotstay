'use client';

import { useEffect } from 'react';
import { Check } from '@phosphor-icons/react';
import { LogoFull, LogoFullDark } from '@/components/Logo';

export default function CheckoutSuccess() {
  // Sync auth token to extension on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('donotstay_auth');
      if (stored) {
        const { access_token } = JSON.parse(stored);
        if (access_token) {
          // Post message for extension's auth-listener to capture
          window.postMessage({
            type: 'DONOTSTAY_AUTH',
            access_token,
          }, window.location.origin);
          console.log('DoNotStay: Auth token synced to extension from success page');
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-muted gap-6">
      <div className="mb-6 flex justify-center">
        <LogoFull height={32} className="block dark:hidden" />
        <LogoFullDark height={32} className="hidden dark:block" />
      </div>
      <div className="max-w-md p-8 rounded-xl bg-card shadow-md">
        <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-verdict-stay flex items-center justify-center">
          <Check size={28} weight="bold" className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-foreground">
          Payment Successful!
        </h1>
        <p className="text-muted-foreground mb-4">
          Your credits have been added to your account.
        </p>
        <p className="text-sm text-muted-foreground">
          Return to the Booking.com tab and refresh the page to see your full analysis.
        </p>
      </div>
    </div>
  );
}
