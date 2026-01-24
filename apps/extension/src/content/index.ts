import { scrapeHotelInfo, scrapeGraphQLParams } from './scraper';
import { fetchReviewsViaGraphQL } from './reviewFetcher';
import { injectButton, updateButton, type ButtonState } from './button';
import { injectSidebar, showSidebar, hideSidebar, updateSidebar, setAuthSuccessCallback, setCreditsUpdatedCallback } from './sidebar';
import type { AnalyzeResponse, ApiError, HotelInfo, ScrapedReview } from '@donotstay/shared';

// Sync auth from web session via background script API call
// This auto-authenticates users who are logged in on the web (reinstalls, etc.)
async function syncAuthFromWeb(): Promise<void> {
  try {
    console.log('DoNotStay: Checking for web session...');
    const response = await chrome.runtime.sendMessage({ type: 'SYNC_AUTH_FROM_WEB' });
    if (response?.synced) {
      console.log('DoNotStay: Auth synced from web session');
    } else {
      console.log('DoNotStay: No web session found');
    }
  } catch (error) {
    console.log('DoNotStay: Auth sync error (non-blocking):', error);
  }
}

// Inject styles dynamically
function injectStyles() {
  if (document.getElementById('donotstay-styles')) return;
  const style = document.createElement('style');
  style.id = 'donotstay-styles';
  style.textContent = `
    #donotstay-button-container {
      position: fixed;
      bottom: 0;
      right: 0;
      z-index: 999997;
    }
    #donotstay-button-iframe {
      border: none;
      background: transparent;
      width: 280px;
      height: 80px;
    }
    #donotstay-sidebar-container {
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      height: 100vh;
      z-index: 999999;
      transform: translateX(100%);
      transition: transform 0.3s ease-out;
    }
    #donotstay-sidebar-container.visible {
      transform: translateX(0);
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
    }
    #donotstay-sidebar-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    #donotstay-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.3);
      z-index: 999998;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s;
    }
    #donotstay-backdrop.visible { opacity: 1; visibility: visible; }
  `;
  document.head.appendChild(style);
}

// State
let initComplete = false; // Prevents button clicks until init finishes (cache check, etc.)
let isAnalyzing = false;
let currentVerdict: AnalyzeResponse | null = null;
let currentCreditsRemaining: number | undefined = undefined;

// Prefetch state - populated on page load
let prefetchedData: {
  hotelInfo: HotelInfo;
  reviews: ScrapedReview[];
} | null = null;
let prefetchPromise: Promise<void> | null = null;
let prefetchError: string | null = null;

// Prefetch hotel data and reviews on page load
async function prefetchData() {
  try {
    console.log('DoNotStay: Prefetching hotel data and reviews...');

    const hotelInfo = scrapeHotelInfo();
    if (!hotelInfo) {
      console.log('DoNotStay: Could not scrape hotel info for prefetch');
      prefetchError = 'Could not find hotel info';
      return;
    }

    const graphqlParams = scrapeGraphQLParams();
    if (!graphqlParams) {
      console.log('DoNotStay: Could not get GraphQL params for prefetch');
      prefetchError = 'Could not extract page data';
      return;
    }

    const reviews = await fetchReviewsViaGraphQL(graphqlParams);
    if (reviews.length === 0) {
      console.log('DoNotStay: No reviews found during prefetch');
      prefetchError = 'No reviews found';
      return;
    }

    prefetchedData = { hotelInfo, reviews };
    console.log(`DoNotStay: Prefetch complete - ${reviews.length} reviews ready`);
  } catch (error) {
    console.error('DoNotStay: Prefetch error (non-blocking):', error);
    prefetchError = 'Something went wrong';
  }
}

// Check for cached verdict on page load
async function checkCachedVerdict() {
  try {
    // Wait for hotel info from prefetch
    if (prefetchPromise) {
      await prefetchPromise;
    }

    if (!prefetchedData?.hotelInfo) return;

    const { hotelInfo } = prefetchedData;
    console.log('DoNotStay: Checking for cached verdict...');

    const response = await chrome.runtime.sendMessage({
      type: 'CHECK_CACHE',
      hotelId: hotelInfo.hotel_id,
    });

    if (response?.cached && response?.verdict_data) {
      console.log('DoNotStay: Found cached verdict for this hotel:', response.verdict_data.verdict);

      // Don't update if user started analyzing while we were checking cache
      if (isAnalyzing) {
        console.log('DoNotStay: Skipping cached verdict - analysis in progress');
        return;
      }

      // Store the cached verdict so clicking button opens sidebar immediately
      const cachedVerdict: AnalyzeResponse = {
        ...response.verdict_data,
        hotel_id: hotelInfo.hotel_id,
        review_count_analyzed: 0, // Not available from cache
        analyzed_at: response.analyzed_at,
      };
      currentVerdict = cachedVerdict;

      // Update button to show the verdict
      const verdictState = getVerdictState(response.verdict_data.verdict);
      updateButton({ state: verdictState });

      // Pre-populate sidebar with cached data
      updateSidebar({ type: 'verdict', verdict: cachedVerdict });
    }
  } catch (error) {
    console.log('DoNotStay: Cache check error (non-blocking):', error);
  }
}

// Fetch user's credit balance for button display
async function fetchCreditsRemaining(): Promise<number | undefined> {
  try {
    const authStatus = await chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' });
    if (authStatus?.authenticated && authStatus?.user?.credits_remaining !== undefined) {
      return authStatus.user.credits_remaining;
    } else if (authStatus?.anonymous?.checksRemaining !== undefined) {
      return authStatus.anonymous.checksRemaining;
    }
  } catch (error) {
    console.log('DoNotStay: Could not fetch credits (non-blocking):', error);
  }
  return undefined;
}

// Handle successful authentication - trigger re-analysis
function handleAuthSuccess() {
  console.log('DoNotStay: handleAuthSuccess called');
  // Clear current verdict so we re-analyze with auth
  currentVerdict = null;
  console.log('DoNotStay: Sending loading state to sidebar');
  // Update sidebar to show loading state
  updateSidebar({ type: 'loading' });
  console.log('DoNotStay: Calling handleButtonClick');
  // Trigger analysis
  handleButtonClick();
}

// Initialize on page load
async function init() {
  console.log('DoNotStay: Initializing on hotel page');

  // Inject styles first
  injectStyles();

  // Inject sidebar (hidden by default)
  injectSidebar(handleSidebarClose);

  // Set up auth success callback
  setAuthSuccessCallback(handleAuthSuccess);

  // Set up credits updated callback (reuses same logic as auth success)
  setCreditsUpdatedCallback(handleAuthSuccess);

  // Inject button to trigger analysis (starts in loading state)
  injectButton(handleButtonClick);

  // Start prefetching data in background (non-blocking)
  prefetchPromise = prefetchData();

  // Try to sync auth from web session (auto-authenticates returning users)
  await syncAuthFromWeb();

  // Fetch credits and check cached verdict in parallel
  // Button stays in loading until we know what to show
  const [credits] = await Promise.all([
    fetchCreditsRemaining(),
    checkCachedVerdict(),
  ]);

  currentCreditsRemaining = credits;

  // Only show idle state if we don't already have a verdict from cache
  // AND we're not currently analyzing (user may have clicked during init)
  if (!currentVerdict && !isAnalyzing) {
    updateButton({ state: 'idle', credits_remaining: credits });
  }

  // Mark init as complete - button clicks are now allowed
  initComplete = true;
}

async function handleButtonClick() {
  // Don't allow clicks until init completes (cache check, auth sync, etc.)
  // This prevents users from starting a new analysis while we're still
  // checking if there's a cached verdict
  if (!initComplete) return;

  // If we already have a verdict, just open the sidebar
  if (currentVerdict) {
    showSidebar();
    return;
  }

  if (isAnalyzing) return;

  // Set analyzing flag IMMEDIATELY to prevent race conditions with
  // credit update listeners or other async operations resetting to idle
  isAnalyzing = true;

  // Update button to analyzing state (shows spinner)
  updateButton({ state: 'analyzing' });

  await analyzeHotel();
}

async function analyzeHotel() {
  // Note: isAnalyzing is set by handleButtonClick() before calling this function
  try {
    // Wait for prefetch if still in progress
    if (prefetchPromise) {
      await prefetchPromise;
    }

    // Use prefetched data or show specific error
    if (!prefetchedData) {
      updateButton({ state: 'error', message: prefetchError || 'Could not load hotel data' });
      return;
    }

    const { hotelInfo, reviews } = prefetchedData;
    console.log(`DoNotStay: Analyzing ${hotelInfo.hotel_name} with ${reviews.length} prefetched reviews`);

    // Send to background script for API analysis (the only network call after click)
    console.log('DoNotStay: Sending to analyze API...');
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE',
      hotel: hotelInfo,
      reviews,
    });

    console.log('DoNotStay: API response:', response);

    // Handle null/undefined response
    if (!response) {
      updateButton({ state: 'error', message: 'No response from API' });
      return;
    }

    // Handle errors
    if ('error' in response) {
      const error = response as ApiError;

      if (error.code === 'RATE_LIMITED' || error.code === 'SIGNUP_REQUIRED' || error.code === 'NO_CREDITS') {
        updateButton({ state: 'rate_limited', credits_remaining: 0 });
        updateSidebar({
          type: 'rate_limited',
          rate_limit: error.rate_limit,
          tier: error.rate_limit?.tier,
        });
        // Automatically open sidebar to show rate limit / signup / purchase info
        showSidebar();
      } else if (error.code === 'NO_REVIEWS') {
        updateButton({ state: 'error', message: 'No reviews found' });
        updateSidebar({ type: 'error', message: 'No reviews found for this hotel' });
      } else {
        updateButton({ state: 'error', message: error.error });
        updateSidebar({ type: 'error', message: error.error });
      }
      return;
    }

    // Success - update button with verdict
    currentVerdict = response as AnalyzeResponse;

    const verdictState = getVerdictState(currentVerdict.verdict);
    updateButton({ state: verdictState });
    updateSidebar({ type: 'verdict', verdict: currentVerdict });

    // Automatically open sidebar to show the verdict
    showSidebar();
  } catch (error) {
    console.error('DoNotStay: Analysis error', error);
    updateButton({ state: 'error', message: 'Something went wrong' });
    updateSidebar({ type: 'error', message: 'Something went wrong. Please try again.' });
  } finally {
    isAnalyzing = false;
  }
}

function getVerdictState(verdict: string): ButtonState {
  switch (verdict) {
    case 'Stay':
      return 'stay';
    case 'Questionable':
      return 'depends';
    case 'Do Not Stay':
      return 'do_not_stay';
    default:
      return 'depends';
  }
}

function handleSidebarClose() {
  hideSidebar();
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TRIGGER_ANALYSIS') {
    handleButtonClick();
  }
});

// Listen for credit changes in storage (reactive updates)
chrome.storage.onChanged.addListener((changes) => {
  if (changes.cachedCredits?.newValue !== undefined) {
    const newCredits = changes.cachedCredits.newValue;
    console.log('DoNotStay: Credits updated to', newCredits);
    currentCreditsRemaining = newCredits;
    // Update button if in idle state (not analyzing or showing verdict)
    // Also wait for init to complete to avoid overwriting loading state
    if (initComplete && !isAnalyzing && !currentVerdict) {
      updateButton({ state: 'idle', credits_remaining: newCredits });
    }
  }
});

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
