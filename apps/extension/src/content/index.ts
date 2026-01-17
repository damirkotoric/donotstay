import { scrapeHotelInfo, scrapeGraphQLParams } from './scraper';
import { fetchReviewsViaGraphQL } from './reviewFetcher';
import { injectButton, updateButton, type ButtonState } from './button';
import { injectSidebar, showSidebar, hideSidebar, updateSidebar } from './sidebar';
import type { AnalyzeResponse, ApiError, HotelInfo, ScrapedReview } from '@donotstay/shared';

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
    #donotstay-sidebar-container.visible { transform: translateX(0); }
    #donotstay-sidebar-iframe {
      width: 100%;
      height: 100%;
      border: none;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.1);
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
let isAnalyzing = false;
let currentVerdict: AnalyzeResponse | null = null;

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

// Initialize on page load
async function init() {
  console.log('DoNotStay: Initializing on hotel page');

  // Inject styles first
  injectStyles();

  // Inject sidebar (hidden by default)
  injectSidebar(handleSidebarClose);

  // Inject button to trigger analysis
  injectButton(handleButtonClick);

  // Start prefetching data in background (non-blocking)
  prefetchPromise = prefetchData();
}

async function handleButtonClick() {
  // If we already have a verdict, just open the sidebar
  if (currentVerdict) {
    showSidebar();
    return;
  }

  if (isAnalyzing) return;

  // Update button to loading state
  updateButton({ state: 'loading' });

  await analyzeHotel();
}

async function analyzeHotel() {
  if (isAnalyzing) return;
  isAnalyzing = true;

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

      if (error.code === 'RATE_LIMITED') {
        updateButton({ state: 'rate_limited' });
        updateSidebar({ type: 'rate_limited', rate_limit: error.rate_limit });
        // Automatically open sidebar to show rate limit info
        showSidebar();
      } else if (error.code === 'NO_REVIEWS') {
        updateButton({ state: 'error', message: 'No reviews found' });
      } else {
        updateButton({ state: 'error', message: error.error });
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

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
