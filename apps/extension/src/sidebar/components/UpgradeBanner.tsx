import { useState, useEffect, useCallback } from 'react';
import { Check, ArrowsClockwise } from '@phosphor-icons/react';
import { Button } from '@donotstay/ui';
import { CREDIT_PACKS } from '@donotstay/shared';
import { WEB_URL } from '../../utils/constants';

type CheckoutState = 'idle' | 'loading' | 'polling' | 'success' | 'error' | 'timeout';

// Safe wrapper for chrome.runtime.sendMessage (handles dev mode)
function sendMessage<T>(message: unknown): Promise<T | null> {
  if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
    return chrome.runtime.sendMessage(message);
  }
  return Promise.resolve(null);
}

function UpgradeBanner() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [initialCredits, setInitialCredits] = useState<number | null>(null);
  const [newCreditBalance, setNewCreditBalance] = useState<number | null>(null);
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);

  useEffect(() => {
    // Check auth status on mount
    sendMessage<{ authenticated?: boolean }>({ type: 'GET_AUTH_STATUS' }).then((response) => {
      setIsAuthenticated(response?.authenticated ?? false);
    });
  }, []);

  const pollForCredits = useCallback(async () => {
    const startTime = Date.now();
    const timeout = 3 * 60 * 1000; // 3 minutes
    const interval = 3000; // 3 seconds

    const checkCredits = async (): Promise<boolean> => {
      try {
        const response = await sendMessage<{ authenticated?: boolean; user?: { credits_remaining?: number } }>({ type: 'GET_AUTH_STATUS' });

        // Check if we became authenticated (user completed checkout and returned to success page)
        if (response?.authenticated && response?.user?.credits_remaining !== undefined) {
          // Update auth state
          setIsAuthenticated(true);

          // Check if we have credits
          if (response.user.credits_remaining > 0) {
            setNewCreditBalance(response.user.credits_remaining);
            setCheckoutState('success');
            return true;
          }
        }

        // Also check against initial credits if already authenticated
        if (response?.user?.credits_remaining !== undefined) {
          if ((initialCredits !== null && response.user.credits_remaining > initialCredits) ||
              (initialCredits === 0 && response.user.credits_remaining > 0)) {
            setNewCreditBalance(response.user.credits_remaining);
            setCheckoutState('success');
            return true;
          }
        }
      } catch {
        // Continue polling on error
      }
      return false;
    };

    const poll = async () => {
      if (await checkCredits()) return;
      if (Date.now() - startTime > timeout) {
        if (await checkCredits()) return;
        // Show timeout state with manual check option
        setCheckoutState('timeout');
        return;
      }
      setTimeout(poll, interval);
    };

    poll();
  }, [initialCredits]);

  useEffect(() => {
    if (checkoutState === 'polling') {
      pollForCredits();
    }
  }, [checkoutState, pollForCredits]);

  const handleManualCheck = async () => {
    setIsCheckingCredits(true);
    try {
      const response = await sendMessage<{ authenticated?: boolean; user?: { credits_remaining?: number } }>({ type: 'GET_AUTH_STATUS' });

      if (response?.authenticated) {
        setIsAuthenticated(true);
      }

      if (response?.user?.credits_remaining && response.user.credits_remaining > 0) {
        setNewCreditBalance(response.user.credits_remaining);
        setCheckoutState('success');
      }
    } catch {
      // Ignore errors
    } finally {
      setIsCheckingCredits(false);
    }
  };

  const handleBuyCredits = async () => {
    // If not authenticated, redirect to auth flow with checkout redirect
    if (!isAuthenticated) {
      window.open(`${WEB_URL}/checkout?pack=standard`, '_blank');
      setCheckoutState('polling');
      return;
    }

    setError(null);
    setCheckoutState('loading');

    try {
      const authResponse = await sendMessage<{ user?: { credits_remaining?: number } }>({ type: 'GET_AUTH_STATUS' });
      if (authResponse?.user?.credits_remaining !== undefined) {
        setInitialCredits(authResponse.user.credits_remaining);
      }

      const response = await sendMessage<{ error?: string; checkout_url?: string }>({
        type: 'CREATE_CHECKOUT',
        pack_type: 'standard',
      });

      if (response?.error) {
        setError(response.error);
        setCheckoutState('error');
        return;
      }

      if (response?.checkout_url) {
        setCheckoutState('polling');
      } else {
        setError('Failed to create checkout session');
        setCheckoutState('error');
      }
    } catch {
      setError('Network error. Please try again.');
      setCheckoutState('error');
    }
  };

  const handleSignIn = () => {
    window.open(`${WEB_URL}/auth/login`, '_blank');
  };

  const handleSeeAllOptions = () => {
    window.open(`${WEB_URL}/#pricing`, '_blank');
  };

  // Loading state
  if (isAuthenticated === null) {
    return null;
  }

  // Success state
  if (checkoutState === 'success') {
    return (
      <div className="bg-verdict-stay/10 border border-verdict-stay/20 rounded-xl p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-verdict-stay flex items-center justify-center mx-auto mb-3">
          <Check size={20} weight="bold" className="text-primary-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground mb-1">Payment Successful!</p>
        {newCreditBalance !== null && (
          <p className="text-xs text-muted-foreground">
            You now have {newCreditBalance} checks available.
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Refresh the page to see full analysis.
        </p>
      </div>
    );
  }

  // Timeout state - payment may have completed but we couldn't detect it
  if (checkoutState === 'timeout') {
    return (
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
        <p className="text-sm font-semibold text-foreground mb-1">
          Completed your purchase?
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Click below to check for your credits.
        </p>
        <Button
          size="sm"
          onClick={handleManualCheck}
          disabled={isCheckingCredits}
          loading={isCheckingCredits}
          className="w-full max-w-2xs mb-2"
        >
          <ArrowsClockwise size={16} weight="bold" className="mr-1" />
          {isCheckingCredits ? 'Checking...' : 'Check for credits'}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCheckoutState('idle')}
          className="w-full max-w-2xs"
        >
          Start over
        </Button>
      </div>
    );
  }

  // Main upgrade UI (same for authenticated and unauthenticated)
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
      <p className="text-base font-semibold text-foreground mb-1">
        Unlock full analysis
      </p>
      <p className="text-sm text-muted-foreground mb-3">
        See all red flags, personas, and more
      </p>

      {error && (
        <p className="text-xs text-destructive mb-2">{error}</p>
      )}

      {checkoutState === 'polling' && (
        <p className="text-xs text-muted-foreground mb-2">
          Complete payment in the new tab...
        </p>
      )}

      <Button
        size="default"
        onClick={handleBuyCredits}
        disabled={checkoutState === 'loading' || checkoutState === 'polling'}
        loading={checkoutState === 'loading'}
        className="w-full max-w-2xs mb-2"
      >
        {checkoutState === 'loading' ? 'Loading...' : checkoutState === 'polling' ? 'Waiting...' : `Get ${CREDIT_PACKS.standard.credits} checks — $${(CREDIT_PACKS.standard.priceCents / 100).toFixed(2)}`}
      </Button>

      <Button
        variant="outline"
        size="default"
        onClick={handleSeeAllOptions}
        className="mt-1 w-full max-w-2xs mb-2"
      >
        See all packages
      </Button>

      {!isAuthenticated && (
        <button
          onClick={handleSignIn}
          className="block w-full mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Already have an account? <span className="underline">Log in</span>
        </button>
      )}
    </div>
  );
}

export default UpgradeBanner;
