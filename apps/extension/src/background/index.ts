import type { AnalyzeRequest, AnalyzeResponse, ApiError, HotelInfo, ScrapedReview } from '@donotstay/shared';

const API_URL = 'http://localhost:3000/api';

interface AnalyzeMessage {
  type: 'ANALYZE';
  hotel: HotelInfo;
  reviews: ScrapedReview[];
}

interface GetAuthMessage {
  type: 'GET_AUTH_STATUS';
}

interface Message {
  type: string;
}

type ExtensionMessage = AnalyzeMessage | GetAuthMessage | Message;

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

  return false;
});

/**
 * Send reviews to analyze API
 */
async function handleAnalyze(hotel: HotelInfo, reviews: ScrapedReview[]): Promise<AnalyzeResponse | ApiError> {
  try {
    console.log(`DoNotStay: Sending ${reviews.length} reviews for analysis`);

    const authToken = await getStoredToken();
    const request: AnalyzeRequest = { hotel, reviews };

    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (!response.ok) {
      return data as ApiError;
    }

    return data as AnalyzeResponse;
  } catch (error) {
    console.error('DoNotStay: Error in analyze:', error);
    return {
      error: 'Failed to analyze hotel. Please try again.',
      code: 'NETWORK_ERROR',
    };
  }
}

async function getStoredToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result) => {
      resolve(result.authToken || null);
    });
  });
}

async function getAuthStatus() {
  const token = await getStoredToken();

  if (!token) {
    return { authenticated: false, user: null };
  }

  try {
    const response = await fetch(`${API_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      await chrome.storage.local.remove(['authToken']);
      return { authenticated: false, user: null };
    }

    const user = await response.json();
    return { authenticated: true, user };
  } catch {
    return { authenticated: false, user: null };
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  if (tab.id && tab.url?.includes('booking.com/hotel/')) {
    chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_ANALYSIS' });
  }
});

console.log('DoNotStay background service worker initialized');
