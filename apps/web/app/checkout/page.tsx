'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { SpinnerGap, Envelope, PaperPlaneTilt, ArrowLeft } from '@phosphor-icons/react';
import { LogoFull, LogoFullDark } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CREDIT_PACKS } from '@donotstay/shared';
import type { CreditPackType } from '@donotstay/shared';

type Step = 'email' | 'code' | 'checkout';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const packType = (searchParams.get('pack') as CreditPackType) || 'standard';

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Check for existing auth on mount
  useEffect(() => {
    const stored = localStorage.getItem('donotstay_auth');
    if (stored) {
      try {
        const { access_token } = JSON.parse(stored);
        if (access_token) {
          setAccessToken(access_token);
          setStep('checkout');
        }
      } catch {
        // Invalid stored auth
      }
    }
  }, []);

  const pack = CREDIT_PACKS[packType];
  const packNames: Record<CreditPackType, string> = {
    entry: 'Entry Pack',
    standard: 'Standard Pack',
    traveler: 'Traveler Pack',
  };

  if (!pack) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-muted">
        <div className="max-w-md p-8 rounded-xl bg-card shadow-md">
          <h1 className="text-xl font-bold mb-4 text-foreground">Invalid Pack</h1>
          <p className="text-muted-foreground mb-6">
            The selected credit pack doesn&apos;t exist.
          </p>
          <Button asChild>
            <a href="/#pricing">View Pricing</a>
          </Button>
        </div>
      </div>
    );
  }

  const packName = packNames[packType];

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send code');
      }

      setStatus('idle');
      setStep('code');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setErrorMessage('Please enter the 6-digit code');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      // Store auth and proceed to checkout
      localStorage.setItem('donotstay_auth', JSON.stringify({
        access_token: data.access_token,
        user: data.user,
      }));

      // Notify extension about the auth token
      window.postMessage({
        type: 'DONOTSTAY_AUTH',
        access_token: data.access_token,
      }, window.location.origin);

      setAccessToken(data.access_token);
      setStep('checkout');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid code');
      setStatus('error');
    }
  };

  const createCheckout = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ pack_type: packType }),
      });

      const data = await response.json();

      if (!response.ok) {
        // If unauthorized, clear stored auth and go back to email step
        if (response.status === 401) {
          localStorage.removeItem('donotstay_auth');
          setAccessToken(null);
          setStep('email');
          setErrorMessage('Session expired. Please sign in again.');
          setStatus('error');
          return;
        }
        throw new Error(data.error || 'Failed to create checkout');
      }

      // Redirect to Stripe
      window.location.href = data.checkout_url;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to create checkout');
      setStatus('error');
    }
  }, [accessToken, packType]);

  // Create checkout when we have a token
  useEffect(() => {
    if (step === 'checkout' && accessToken) {
      createCheckout();
    }
  }, [step, accessToken, createCheckout]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-muted">
      <div className="mb-8">
        <LogoFull height={32} className="block dark:hidden" />
        <LogoFullDark height={32} className="hidden dark:block" />
      </div>

      <div className="w-full max-w-md p-8 rounded-xl bg-card shadow-md">
        {/* Pack info */}
        <div className="text-center mb-6 pb-6 border-b border-border">
          <h1 className="text-xl font-bold text-foreground">{packName}</h1>
          <p className="text-3xl font-bold text-foreground mt-2">{pack.credits} checks</p>
          <p className="text-lg text-muted-foreground">{pack.priceDisplay}</p>
        </div>

        {step === 'email' && (
          <>
            <div className="text-center mb-6">
              <Envelope weight="bold" className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground">Enter your email</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We&apos;ll send you a code to verify your email.
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={status === 'loading'}
              />

              {status === 'error' && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <Button
                type="submit"
                disabled={status === 'loading'}
                className="w-full"
                size="lg"
              >
                {status === 'loading' ? (
                  <SpinnerGap className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <PaperPlaneTilt weight="bold" className="w-5 h-5 mr-2" />
                    Send Code
                  </>
                )}
              </Button>
            </form>
          </>
        )}

        {step === 'code' && (
          <>
            <div className="flex justify-center mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep('email');
                  setCode('');
                  setErrorMessage('');
                }}
              >
                <ArrowLeft weight="bold" className="w-4 h-4 mr-1" />
                Back
              </Button>
            </div>

            <div className="text-center mb-6">
              <Envelope weight="bold" className="w-10 h-10 text-primary mx-auto mb-3" />
              <h2 className="text-lg font-semibold text-foreground">Enter your code</h2>
              <p className="text-sm text-muted-foreground mt-1">
                We sent a 6-digit code to <span className="font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="text-center text-2xl tracking-widest"
                disabled={status === 'loading'}
              />

              {status === 'error' && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <Button
                type="submit"
                disabled={status === 'loading' || code.length !== 6}
                className="w-full"
                size="lg"
              >
                {status === 'loading' ? (
                  <SpinnerGap className="w-5 h-5 animate-spin" />
                ) : (
                  'Verify & Continue'
                )}
              </Button>
            </form>
          </>
        )}

        {step === 'checkout' && (
          <div className="text-center py-8">
            <SpinnerGap className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">
              {status === 'error' ? errorMessage : 'Redirecting to checkout...'}
            </p>
            {status === 'error' && (
              <Button
                onClick={createCheckout}
                className="mt-4"
              >
                Try Again
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-muted">
        <SpinnerGap className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
