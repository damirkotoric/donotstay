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

interface CreateCheckoutMessage {
  type: 'CREATE_CHECKOUT';
  pack_type: CreditPackType;
}

interface Message {
  type: string;
}

type ExtensionMessage = AnalyzeMessage | GetAuthMessage | CheckCacheMessage | GetAnonymousChecksMessage | StoreAuthTokenMessage | CreateCheckoutMessage | Message;

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

  if (message.type === 'STORE_AUTH_TOKEN') {
    const authMessage = message as StoreAuthTokenMessage;
    chrome.storage.local.set({ authToken: authMessage.token }, () => {
      console.log('DoNotStay: Auth token stored');
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
  const anonymousChecksUsed = await getAnonymousChecksUsed();

  if (!token) {
    return {
      authenticated: false,
      user: null,
      anonymous: {
        deviceId: anonymousId,
        checksUsed: anonymousChecksUsed,
        checksRemaining: Math.max(0, ANONYMOUS_TIER_LIMIT - anonymousChecksUsed),
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
      return {
        authenticated: false,
        user: null,
        anonymous: {
          deviceId: anonymousId,
          checksUsed: anonymousChecksUsed,
          checksRemaining: Math.max(0, ANONYMOUS_TIER_LIMIT - anonymousChecksUsed),
        },
      };
    }

    const user = await response.json();
    return { authenticated: true, user, anonymous: null };
  } catch {
    return {
      authenticated: false,
      user: null,
      anonymous: {
        deviceId: anonymousId,
        checksUsed: anonymousChecksUsed,
        checksRemaining: Math.max(0, ANONYMOUS_TIER_LIMIT - anonymousChecksUsed),
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

console.log('DoNotStay background service worker initialized');
