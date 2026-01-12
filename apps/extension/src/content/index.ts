import { scrapeHotelInfo, scrapeReviews } from './scraper';
import { injectBadge, updateBadge, type BadgeState } from './badge';
import { injectSidebar, showSidebar, hideSidebar, updateSidebar } from './sidebar';
import type { AnalyzeResponse, ApiError } from '@donotstay/shared';

// State
let isAnalyzing = false;
let currentVerdict: AnalyzeResponse | null = null;

// Initialize on page load
async function init() {
  console.log('DoNotStay: Initializing on hotel page');

  // Inject UI components
  injectBadge(handleBadgeClick);
  injectSidebar(handleSidebarClose);

  // Start analysis
  await analyzeHotel();
}

async function analyzeHotel() {
  if (isAnalyzing) return;
  isAnalyzing = true;

  updateBadge({ state: 'loading' });

  try {
    // Scrape hotel info
    const hotelInfo = scrapeHotelInfo();
    if (!hotelInfo) {
      updateBadge({ state: 'error', message: 'Could not find hotel info' });
      return;
    }

    // Scrape reviews
    const reviews = await scrapeReviews();
    if (reviews.length === 0) {
      updateBadge({ state: 'error', message: 'No reviews found' });
      return;
    }

    console.log(`DoNotStay: Scraped ${reviews.length} reviews for ${hotelInfo.hotel_name}`);

    // Send to background script for API call
    const response = await chrome.runtime.sendMessage({
      type: 'ANALYZE_HOTEL',
      hotel: hotelInfo,
      reviews,
    });

    if ('error' in response) {
      const error = response as ApiError;
      if (error.code === 'RATE_LIMITED') {
        updateBadge({ state: 'rate_limited' });
        updateSidebar({ type: 'rate_limited', rate_limit: error.rate_limit });
      } else {
        updateBadge({ state: 'error', message: error.error });
        updateSidebar({ type: 'error', message: error.error });
      }
      return;
    }

    // Success
    currentVerdict = response as AnalyzeResponse;
    const verdictState = getVerdictState(currentVerdict.verdict);
    updateBadge({
      state: verdictState,
      verdict: currentVerdict.verdict,
      confidence: currentVerdict.confidence,
    });
    updateSidebar({ type: 'verdict', verdict: currentVerdict });
  } catch (error) {
    console.error('DoNotStay: Analysis error', error);
    updateBadge({ state: 'error', message: 'Something went wrong' });
  } finally {
    isAnalyzing = false;
  }
}

function getVerdictState(verdict: string): BadgeState {
  switch (verdict) {
    case 'Stay':
      return 'stay';
    case 'It depends':
      return 'depends';
    case 'Do Not Stay':
      return 'do_not_stay';
    default:
      return 'depends';
  }
}

function handleBadgeClick() {
  showSidebar();
}

function handleSidebarClose() {
  hideSidebar();
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'TRIGGER_ANALYSIS') {
    analyzeHotel();
  }
});

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
