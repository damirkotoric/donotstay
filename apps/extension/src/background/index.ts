import type { AnalyzeRequest, AnalyzeResponse, ApiError, HotelInfo, ScrapedReview, VerdictResult, CreditPackType, CreditPurchaseResponse } from '@donotstay/shared';
import { ANONYMOUS_TIER_LIMIT } from '@donotstay/shared';
import { API_URL } from '../utils/constants';

interface AnalyzeMessage {
  type: 'ANALYZE';
  hotel: HotelInfo;
  reviews: ScrapedReview[];
}

interface GetAuthMessage {
  type: 'GET_AUTH_STATUS';
}

interface CheckCacheMessage {
  type: 'CHECK_CACHE';
  hotelId: string;
}

interface GetAnonymousChecksMessage {
  type: 'GET_ANONYMOUS_CHECKS';
}

interface StoreAuthTokenMessage {
  type: 'STORE_AUTH_TOKEN';
  token: string;
}

interface ClearAuthTokenMessage {
  type: 'CLEAR_AUTH_TOKEN';
}

interface CreateCheckoutMessage {
  type: 'CREATE_CHECKOUT';
  pack_type: CreditPackType;
}

interface SyncAuthFromWebMessage {
  type: 'SYNC_AUTH_FROM_WEB';
}

interface Message {
  type: string;
}

type ExtensionMessage = AnalyzeMessage | GetAuthMessage | CheckCacheMessage | GetAnonymousChecksMessage | StoreAuthTokenMessage | ClearAuthTokenMessage | CreateCheckoutMessage | SyncAuthFromWebMessage | Message;

interface CheckCacheResponse {
  cached: boolean;
  verdict_data?: VerdictResult;
  analyzed_at?: string;
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message: ExtensionMessage, _sender, sendResponse) => {
  if (message.type === 'ANALYZE') {
    const analyzeMessage = message as AnalyzeMessage;
    handleAnalyze(analyzeMessage.hotel, analyzeMessage.reviews)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ error: error.message, code: 'UNKNOWN_ERROR' });
      });
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'GET_AUTH_STATUS') {
    getAuthStatus()
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === 'CHECK_CACHE') {
    const cacheMessage = message as CheckCacheMessage;
    handleCheckCache(cacheMessage.hotelId)
      .then(sendResponse)
      .catch((error) => {
        sendResponse({ cached: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'GET_ANONYMOUS_CHECKS') {
    getAnonymousChecksUsed()
      .then((count) => sendResponse({ count }))
      .catch(() => sendResponse({ count: 0 }));
    return true;
  }

  if (message.type === 'HAS_ACCOUNT') {
    hasAccount()
      .then((result) => sendResponse(result))
      .catch(() => sendResponse(false));
    return true;
  }

  if (message.type === 'STORE_AUTH_TOKEN') {
    const authMessage = message as StoreAuthTokenMessage;
    (async () => {
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({
          authToken: authMessage.token,
          donotstay_has_account: true  // Flag to remember user has logged in before
        }, () => resolve());
      });
      console.log('DoNotStay: Auth token stored');
      // Claim anonymous credits for the new auth
      await claimAnonymousCredits(authMessage.token);
      sendResponse({ success: true });
    })();
    return true;
  }

  if (message.type === 'CLEAR_AUTH_TOKEN') {
    chrome.storage.local.remove(['authToken', 'cachedCredits'], () => {
      console.log('DoNotStay: Auth token cleared');
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.type === 'CREATE_CHECKOUT') {
    const checkoutMessage = message as CreateCheckoutMessage;
    handleCreateCheckout(checkoutMessage.pack_type)
      .then(sendResponse)
      .catch((error: Error) => {
        sendResponse({ error: error.message });
      });
    return true;
  }

  if (message.type === 'SYNC_AUTH_FROM_WEB') {
    syncAuthFromWeb()
      .then(sendResponse)
      .catch((error: Error) => {
        sendResponse({ synced: false, error: error.message });
      });
    return true;
  }

  return false;
});

/**
 * Get or create anonymous device ID
 */
async function getAnonymousId(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['anonymousId'], (result) => {
      if (result.anonymousId) {
        resolve(result.anonymousId);
      } else {
        const id = `anon_${crypto.randomUUID()}`;
        chrome.storage.local.set({ anonymousId: id }, () => {
          resolve(id);
        });
      }
    });
  });
}

/**
 * Get the count of anonymous checks used (stored locally for quick UI access)
 */
async function getAnonymousChecksUsed(): Promise<number> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['anonymousChecksUsed'], (result) => {
      resolve(result.anonymousChecksUsed || 0);
    });
  });
}

/**
 * Send reviews to analyze API
 */
async function handleAnalyze(hotel: HotelInfo, reviews: ScrapedReview[]): Promise<AnalyzeResponse | ApiError> {
  try {
    console.log(`DoNotStay: Sending ${reviews.length} reviews for analysis`);

    const authToken = await getStoredToken();
    const userHasAccount = await hasAccount();

    // Block anonymous checks for returning users
    if (!authToken && userHasAccount) {
      console.log('DoNotStay: User has account but not authenticated - login required');
      return {
        error: 'Please log in to continue',
        code: 'LOGIN_REQUIRED',
      };
    }

    const anonymousId = authToken ? null : await getAnonymousId();
    const request: AnalyzeRequest = { hotel, reviews };

    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(anonymousId ? { 'X-Device-ID': anonymousId } : {}),
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return data as ApiError;
    }

    const analyzeResponse = data as AnalyzeResponse;

    // Sync local counter with server's credits_remaining (source of truth)
    if (!authToken && analyzeResponse.credits_remaining !== undefined) {
      const checksUsed = ANONYMOUS_TIER_LIMIT - analyzeResponse.credits_remaining;
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ anonymousChecksUsed: checksUsed }, () => resolve());
      });
    }

    return analyzeResponse;
  } catch (error) {
    console.error('DoNotStay: Error in analyze:', error);
    return {
      error: 'Error analyzing',
      code: 'NETWORK_ERROR',
    };
  }
}

/**
 * Check if user has a cached verdict for this hotel (per-user caching)
 */
async function handleCheckCache(hotelId: string): Promise<CheckCacheResponse> {
  try {
    const authToken = await getStoredToken();
    const anonymousId = authToken ? null : await getAnonymousId();

    const params = new URLSearchParams({
      hotel_id: hotelId,
    });

    const response = await fetch(`${API_URL}/check-cache?${params}`, {
      method: 'GET',
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(anonymousId ? { 'X-Device-ID': anonymousId } : {}),
      },
    });

    if (!response.ok) {
      return { cached: false };
    }

    return await response.json();
  } catch (error) {
    console.error('DoNotStay: Error checking cache:', error);
    return { cached: false };
  }
}

async function getStoredToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || null);
    });
  });
}

/**
 * Check if user has previously created an account
 */
async function hasAccount(): Promise<boolean> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['donotstay_has_account'], (result) => {
      resolve(!!result.donotstay_has_account);
    });
  });
}

/**
 * Sync auth from web session cookie
 * This checks if user is logged in on the web and syncs their auth to the extension
 */
async function syncAuthFromWeb(): Promise<{ synced: boolean; error?: string }> {
  try {
    // Check if already authenticated
    const existingToken = await getStoredToken();
    if (existingToken) {
      console.log('DoNotStay: Already authenticated, skipping web sync');
      return { synced: false };
    }

    // Call the session API with credentials to send cookies
    const response = await fetch(`${API_URL}/auth/session`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return { synced: false, error: 'Failed to check session' };
    }

    const data = await response.json();

    if (data.authenticated && data.access_token) {
      // Store the token
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({
          authToken: data.access_token,
          donotstay_has_account: true,
        }, () => {
          console.log('DoNotStay: Auth synced from web session');
          resolve();
        });
      });
      // Claim anonymous credits for the synced auth
      await claimAnonymousCredits(data.access_token);
      return { synced: true };
    }

    return { synced: false };
  } catch (error) {
    console.error('DoNotStay: Error syncing auth from web:', error);
    return { synced: false, error: 'Network error' };
  }
}

/**
 * Claim anonymous credits for a newly authenticated user
 * This adds remaining anonymous checks to the user's account
 */
async function claimAnonymousCredits(authToken: string): Promise<void> {
  try {
    const anonymousId = await getAnonymousId();

    console.log('DoNotStay: Claiming anonymous credits for device:', anonymousId);

    const response = await fetch(`${API_URL}/claim-anonymous-credits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ device_id: anonymousId }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.credits_added > 0) {
        console.log(`DoNotStay: Claimed ${data.credits_added} anonymous credits`);
      } else if (data.already_claimed) {
        console.log('DoNotStay: Anonymous credits already claimed');
      }
    } else {
      console.log('DoNotStay: Failed to claim anonymous credits');
    }
  } catch (error) {
    console.error('DoNotStay: Error claiming anonymous credits:', error);
  }
}

/**
 * Create Stripe checkout session and open in new tab
 */
async function handleCreateCheckout(packType: CreditPackType): Promise<{ checkout_url?: string; error?: string }> {
  try {
    const authToken = await getStoredToken();

    if (!authToken) {
      return { error: 'Please sign in to purchase credits' };
    }

    const response = await fetch(`${API_URL}/stripe/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ pack_type: packType }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to create checkout session' };
    }

    const checkoutResponse = data as CreditPurchaseResponse;

    if (checkoutResponse.checkout_url) {
      // Open Stripe checkout in new tab
      chrome.tabs.create({ url: checkoutResponse.checkout_url });
      return { checkout_url: checkoutResponse.checkout_url };
    }

    return { error: 'No checkout URL received' };
  } catch (error) {
    console.error('DoNotStay: Error creating checkout:', error);
    return { error: 'Network error. Please try again.' };
  }
}

async function getAuthStatus() {
  const token = await getStoredToken();
  const anonymousId = await getAnonymousId();

  if (!token) {
    // Fetch actual check count from server (source of truth)
    let checksUsed = 0;
    let checksRemaining = ANONYMOUS_TIER_LIMIT;

    try {
      const response = await fetch(`${API_URL}/anonymous-status`, {
        method: 'GET',
        headers: {
          'X-Device-ID': anonymousId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        checksUsed = data.checks_used;
        checksRemaining = data.checks_remaining;
        // Sync local storage with server
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({ anonymousChecksUsed: checksUsed }, () => resolve());
        });
      }
    } catch (error) {
      // Fall back to local storage if server unavailable
      checksUsed = await getAnonymousChecksUsed();
      checksRemaining = Math.max(0, ANONYMOUS_TIER_LIMIT - checksUsed);
    }

    // Cache credits in storage for reactive updates
    chrome.storage.local.set({ cachedCredits: checksRemaining });
    return {
      authenticated: false,
      user: null,
      anonymous: {
        deviceId: anonymousId,
        checksUsed,
        checksRemaining,
      },
    };
  }

  try {
    const response = await fetch(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await chrome.storage.local.remove(['authToken']);
      const localChecksUsed = await getAnonymousChecksUsed();
      return {
        authenticated: false,
        user: null,
        anonymous: {
          deviceId: anonymousId,
          checksUsed: localChecksUsed,
          checksRemaining: Math.max(0, ANONYMOUS_TIER_LIMIT - localChecksUsed),
        },
      };
    }

    const user = await response.json();
    // Cache credits in storage for reactive updates
    chrome.storage.local.set({ cachedCredits: user.credits_remaining });
    return { authenticated: true, user, anonymous: null };
  } catch {
    const localChecksUsed = await getAnonymousChecksUsed();
    return {
      authenticated: false,
      user: null,
      anonymous: {
        deviceId: anonymousId,
        checksUsed: localChecksUsed,
        checksRemaining: Math.max(0, ANONYMOUS_TIER_LIMIT - localChecksUsed),
      },
    };
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id && tab.url?.includes('booking.com/hotel/')) {
    chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_ANALYSIS' });
  }
});

// Open welcome page on first install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: 'https://donotstay.app/welcome' });
  }
});

console.log('DoNotStay background service worker initialized');
