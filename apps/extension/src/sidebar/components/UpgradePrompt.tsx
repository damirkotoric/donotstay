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
  const [hasAttemptedCheckout, setHasAttemptedCheckout] = useState(false);
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);
  const [newCreditBalance, setNewCreditBalance] = useState<number | null>(null);

  // Check if credits have been added since we last showed this screen
  useEffect(() => {
    const checkCreditsOnMount = async () => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
        if (response?.user?.credits_remaining > 0) {
          // Credits have been added! Trigger refresh
          onCreditsUpdated?.();
        }
      } catch {
        // Ignore errors
      }
    };
    checkCreditsOnMount();
  }, [onCreditsUpdated]);

  const pollForCredits = useCallback(async () => {
    const startTime = Date.now();
    const timeout = 3 * 60 * 1000; // 3 minutes
    const interval = 3000; // 3 seconds

    const checkCredits = async (): Promise<boolean> => {
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
        if (response?.user?.credits_remaining !== undefined) {
          // Check if credits increased OR if we now have credits when we had none
          if ((initialCredits !== null && response.user.credits_remaining > initialCredits) ||
              (initialCredits === 0 && response.user.credits_remaining > 0)) {
            setNewCreditBalance(response.user.credits_remaining);
            setCheckoutState('success');
            onCreditsUpdated?.();
            return true;
          }
        }
      } catch {
        // Continue polling on error
      }
      return false;
    };

    const poll = async () => {
      // Check if credits were added
      if (await checkCredits()) {
        return;
      }

      // Check if we've timed out
      if (Date.now() - startTime > timeout) {
        // One final check before giving up
        if (await checkCredits()) {
          return;
        }
        // Timed out - reset to idle so user can try again
        setCheckoutState('idle');
        setHasAttemptedCheckout(true);
        return;
      }

      setTimeout(poll, interval);
    };

    poll();
  }, [initialCredits, onCreditsUpdated]);

  const handleManualCheck = async () => {
    setIsCheckingCredits(true);
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
      if (response?.user?.credits_remaining > 0) {
        setNewCreditBalance(response.user.credits_remaining);
        setCheckoutState('success');
        onCreditsUpdated?.();
      }
    } catch {
      // Ignore errors
    } finally {
      setIsCheckingCredits(false);
    }
  };

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
        <div className="text-sm text-muted-foreground mb-2">
          Your credits have been added to your account.
        </div>
        {newCreditBalance !== null && (
          <div className="text-2xl font-bold text-violet-500 mb-6">
            {newCreditBalance} checks available
          </div>
        )}
        <button
          className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-none py-3.5 px-7 rounded-xl text-[15px] font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30"
          onClick={() => {
            // Close sidebar and start the check
            window.parent.postMessage({ type: 'DONOTSTAY_START_CHECK' }, '*');
          }}
        >
          Start Check
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

      {/* Paid already? Check again link */}
      {hasAttemptedCheckout && checkoutState === 'idle' && (
        <button
          onClick={handleManualCheck}
          disabled={isCheckingCredits}
          className="text-sm text-violet-500 hover:text-violet-600 underline mt-2 mb-2 disabled:opacity-50"
        >
          {isCheckingCredits ? 'Checking...' : 'Paid already? Check again'}
        </button>
      )}

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
      width="38"
      height="16"
      viewBox="0 0 512 214"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground"
    >
      <path d="M512 110.08C512 73.6711 494.364 44.9422 460.658 44.9422C426.809 44.9422 406.329 73.6711 406.329 109.796C406.329 152.604 430.507 174.222 465.209 174.222C482.133 174.222 494.933 170.382 504.604 164.978V136.533C494.933 141.369 483.84 144.356 469.76 144.356C455.964 144.356 443.733 139.52 442.169 122.738H511.716C511.716 120.889 512 113.493 512 110.08ZM441.742 96.5689C441.742 80.4978 451.556 73.8133 460.516 73.8133C469.191 73.8133 478.436 80.4978 478.436 96.5689H441.742ZM351.431 44.9422C337.493 44.9422 328.533 51.4844 323.556 56.0356L321.707 47.2178H290.418V213.049L325.973 205.511L326.116 165.262C331.236 168.96 338.773 174.222 351.289 174.222C376.747 174.222 399.929 153.742 399.929 108.658C399.787 67.4133 376.32 44.9422 351.431 44.9422ZM342.898 142.933C334.507 142.933 329.529 139.947 326.116 136.249L325.973 83.4844C329.671 79.36 334.791 76.5156 342.898 76.5156C355.84 76.5156 364.8 91.0222 364.8 109.653C364.8 128.711 355.982 142.933 342.898 142.933ZM241.493 36.5511L277.191 28.8711V0L241.493 7.53778V36.5511ZM241.493 47.36H277.191V171.804H241.493V47.36ZM203.236 57.8844L200.96 47.36H170.24V171.804H205.796V87.4667C214.187 76.5156 228.409 78.5067 232.818 80.0711V47.36C228.267 45.6533 211.627 42.5244 203.236 57.8844ZM132.124 16.4978L97.4222 23.8933L97.28 137.813C97.28 158.862 113.067 174.364 134.116 174.364C145.778 174.364 154.311 172.231 159.004 169.671V140.8C154.453 142.649 131.982 149.191 131.982 128.142V77.6533H159.004V47.36H131.982L132.124 16.4978ZM35.9822 83.4844C35.9822 77.9378 40.5333 75.8044 48.0711 75.8044C58.88 75.8044 72.5333 79.0756 83.3422 84.9067V51.4844C71.5378 46.7911 59.8756 44.9422 48.0711 44.9422C19.2 44.9422 0 60.0178 0 85.1911C0 124.444 54.0444 118.187 54.0444 135.111C54.0444 141.653 48.3556 143.787 40.3911 143.787C28.5867 143.787 13.5111 138.951 1.56444 132.409V166.258C14.7911 171.947 28.16 174.364 40.3911 174.364C69.9733 174.364 90.3111 159.716 90.3111 134.258C90.1689 91.8756 35.9822 99.4133 35.9822 83.4844Z" />
    </svg>
  );
}

export default UpgradePrompt;
