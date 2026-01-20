import { useState, useEffect, useCallback } from 'react';
import { CREDIT_PACKS } from '@donotstay/shared';
import type { RateLimitInfo, CreditPackType } from '@donotstay/shared';

interface UpgradePromptProps {
  rateLimit?: RateLimitInfo;
  onCreditsUpdated?: () => void;
}

type CheckoutState = 'idle' | 'loading' | 'polling' | 'success' | 'error';

function UpgradePrompt({ rateLimit: _rateLimit, onCreditsUpdated }: UpgradePromptProps) {
  const [selectedPack, setSelectedPack] = useState<CreditPackType>('standard');
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [initialCredits, setInitialCredits] = useState<number | null>(null);

  const pollForCredits = useCallback(async () => {
    const startTime = Date.now();
    const timeout = 2 * 60 * 1000; // 2 minutes
    const interval = 4000; // 4 seconds

    const poll = async () => {
      if (Date.now() - startTime > timeout) {
        setCheckoutState('idle');
        return;
      }

      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
        if (response?.user?.credits_remaining !== undefined) {
          if (initialCredits !== null && response.user.credits_remaining > initialCredits) {
            setCheckoutState('success');
            onCreditsUpdated?.();
            return;
          }
        }
      } catch {
        // Continue polling on error
      }

      setTimeout(poll, interval);
    };

    poll();
  }, [initialCredits, onCreditsUpdated]);

  useEffect(() => {
    if (checkoutState === 'polling') {
      pollForCredits();
    }
  }, [checkoutState, pollForCredits]);

  const handleBuyCredits = async () => {
    setError(null);
    setCheckoutState('loading');

    try {
      // Get current credits before checkout
      const authResponse = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
      if (authResponse?.user?.credits_remaining !== undefined) {
        setInitialCredits(authResponse.user.credits_remaining);
      }

      const response = await chrome.runtime.sendMessage({
        type: 'CREATE_CHECKOUT',
        pack_type: selectedPack,
      });

      if (response?.error) {
        setError(response.error);
        setCheckoutState('error');
        return;
      }

      if (response?.checkout_url) {
        // Checkout opened in new tab, start polling for credit updates
        setCheckoutState('polling');
      } else {
        setError('Failed to create checkout session');
        setCheckoutState('error');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      setCheckoutState('error');
    }
  };

  if (checkoutState === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
        <div className="text-5xl mb-4">&#10003;</div>
        <div className="text-xl font-bold text-foreground mb-2">Payment Successful!</div>
        <div className="text-sm text-muted-foreground mb-6">
          Your credits have been added to your account.
        </div>
        <button
          className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-none py-3.5 px-7 rounded-xl text-[15px] font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30"
          onClick={() => window.location.reload()}
        >
          Continue Checking Hotels
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
      <div className="text-5xl mb-4">&#128274;</div>
      <div className="text-xl font-bold text-foreground mb-2">Out of Credits</div>
      <div className="text-sm text-muted-foreground mb-6">
        Get more credits to continue analyzing hotels.
        <br />
        Credits never expire.
      </div>

      <div className="w-full max-w-xs space-y-3 mb-6">
        <CreditPackOption
          packType="entry"
          credits={CREDIT_PACKS.entry.credits}
          price={CREDIT_PACKS.entry.priceDisplay}
          selected={selectedPack === 'entry'}
          onSelect={() => setSelectedPack('entry')}
          disabled={checkoutState === 'loading' || checkoutState === 'polling'}
        />
        <CreditPackOption
          packType="standard"
          credits={CREDIT_PACKS.standard.credits}
          price={CREDIT_PACKS.standard.priceDisplay}
          isPopular
          selected={selectedPack === 'standard'}
          onSelect={() => setSelectedPack('standard')}
          disabled={checkoutState === 'loading' || checkoutState === 'polling'}
        />
        <CreditPackOption
          packType="traveler"
          credits={CREDIT_PACKS.traveler.credits}
          price={CREDIT_PACKS.traveler.priceDisplay}
          selected={selectedPack === 'traveler'}
          onSelect={() => setSelectedPack('traveler')}
          disabled={checkoutState === 'loading' || checkoutState === 'polling'}
        />
      </div>

      {error && (
        <div className="text-sm text-red-500 mb-4">
          {error}
        </div>
      )}

      {checkoutState === 'polling' && (
        <div className="text-sm text-muted-foreground mb-4">
          Complete payment in the new tab...
        </div>
      )}

      <button
        className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-none py-3.5 px-7 rounded-xl text-[15px] font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
        onClick={handleBuyCredits}
        disabled={checkoutState === 'loading' || checkoutState === 'polling'}
      >
        {checkoutState === 'loading' ? 'Loading...' : checkoutState === 'polling' ? 'Waiting for payment...' : 'Buy Credits'}
      </button>

      {/* Powered by Stripe badge */}
      <div className="flex items-center gap-1.5 mt-4 text-muted-foreground">
        <span className="text-xs">Powered by</span>
        <StripeLogo />
      </div>
    </div>
  );
}

interface CreditPackOptionProps {
  packType: CreditPackType;
  credits: number;
  price: string;
  isPopular?: boolean;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

function CreditPackOption({ credits, price, isPopular, selected, onSelect, disabled }: CreditPackOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
        selected
          ? 'border-violet-500 bg-violet-500/10 ring-2 ring-violet-500/50'
          : isPopular
          ? 'border-violet-500/50 bg-violet-500/5 hover:bg-violet-500/10'
          : 'border-border bg-background hover:bg-muted/50'
      }`}
    >
      <span className="text-sm font-medium text-foreground">
        {credits} checks
        {isPopular && (
          <span className="ml-2 text-xs text-violet-500 font-semibold">Popular</span>
        )}
      </span>
      <span className="text-sm font-bold text-foreground">{price}</span>
    </button>
  );
}

function StripeLogo() {
  return (
    <svg
      width="33"
      height="14"
      viewBox="0 0 60 25"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground"
    >
      <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a12.48 12.48 0 0 1-4.56.86c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.72zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM41.49 20h-4.07V5.36h4.07v.84c.9-.63 2.03-1.2 3.47-1.2 3.34 0 5.85 2.75 5.85 7.33s-2.64 7.57-5.96 7.57c-1.37 0-2.43-.52-3.36-1.16V20zm3.14-10.85c-1.15 0-2.23.59-3.14 1.4v5.9c.85.63 1.8 1.01 3.14 1.01 1.79 0 2.94-1.53 2.94-4.21 0-2.66-1.22-4.1-2.94-4.1zM28.3 5h4.08v14.64H28.3V5zm0-4.64h4.08v3.32H28.3V.36zM23.63 9.06c-1.1-.37-2.17-.4-2.54-.4-.84 0-1.42.28-1.42.84 0 1.87 5.63.82 5.63 5.23 0 3.23-2.75 5.17-5.89 5.17-1.6 0-3.4-.4-4.67-1.1l.85-3.15c1.23.56 2.66.95 3.82.95 1.03 0 1.76-.34 1.76-1.07 0-2.08-5.63-.98-5.63-5.09 0-2.87 2.3-5.3 5.86-5.3 1.5 0 3.13.37 4.17.82l-.94 3.1zM5.8 13.44v-3.3a10.02 10.02 0 0 1 3.13-.56c1.65 0 3.14.19 3.14 1.57v8.29c-1.01.28-2.42.56-4.3.56C3.84 20 0 19.07 0 14.2 0 9.92 3.03 8.62 6.1 8.62c1.16 0 2.26.16 3.27.44l-.38 3.27c-.66-.15-1.48-.22-2.27-.22-1.38 0-2.69.37-2.69 2.08 0 1.8 1.19 2.23 2.47 2.23.69 0 1.28-.07 1.69-.19v-2.79H5.8z" />
    </svg>
  );
}

export default UpgradePrompt;
