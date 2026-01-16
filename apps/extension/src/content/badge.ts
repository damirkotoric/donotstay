// Use Vite env vars for dev mode (set in .env.development / .env.production)
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';
const DEV_SERVER_URL = import.meta.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function getIframeUrl(path: string): string {
  return DEV_MODE ? `${DEV_SERVER_URL}/${path}` : chrome.runtime.getURL(path);
}

export type BadgeState = 'loading' | 'stay' | 'depends' | 'do_not_stay' | 'error' | 'rate_limited';

interface BadgeUpdate {
  state: BadgeState;
  verdict?: string;
  confidence?: number;
  message?: string;
}

let badgeContainer: HTMLElement | null = null;
let badgeIframe: HTMLIFrameElement | null = null;
let clickCallback: (() => void) | null = null;
let currentBadgeState: BadgeUpdate = { state: 'loading' };
let iframeReady = false;

/**
 * Handle messages from badge iframe
 */
function handleBadgeMessage(event: MessageEvent): void {
  if (event.data?.type === 'DONOTSTAY_BADGE_CLICK') {
    if (clickCallback) {
      clickCallback();
    }
  }
  // Badge iframe is ready and requesting current state
  if (event.data?.type === 'DONOTSTAY_BADGE_READY') {
    iframeReady = true;
    // Send current state to the badge
    if (badgeIframe?.contentWindow) {
      badgeIframe.contentWindow.postMessage(
        { type: 'DONOTSTAY_BADGE_UPDATE', payload: currentBadgeState },
        '*'
      );
    }
  }
}

/**
 * Inject the floating badge iframe into the page
 */
export function injectBadge(onClick?: () => void): void {
  // If badge already exists, just update the click callback
  if (badgeContainer && badgeIframe) {
    clickCallback = onClick || null;
    return;
  }

  clickCallback = onClick || null;
  iframeReady = false;

  // Create container
  badgeContainer = document.createElement('div');
  badgeContainer.id = 'donotstay-badge-container';

  // Create iframe
  badgeIframe = document.createElement('iframe');
  badgeIframe.id = 'donotstay-badge-iframe';
  badgeIframe.src = getIframeUrl('src/badge/index.html');

  badgeContainer.appendChild(badgeIframe);
  document.body.appendChild(badgeContainer);

  // Listen for messages from badge iframe
  window.addEventListener('message', handleBadgeMessage);
}

/**
 * Update badge state and content
 */
export function updateBadge(update: BadgeUpdate): void {
  // Always store the state so we can send it when iframe is ready
  currentBadgeState = update;

  // Only send if iframe is ready
  if (iframeReady && badgeIframe?.contentWindow) {
    badgeIframe.contentWindow.postMessage(
      { type: 'DONOTSTAY_BADGE_UPDATE', payload: update },
      '*'
    );
  }
}

/**
 * Remove badge from page
 */
export function removeBadge(): void {
  window.removeEventListener('message', handleBadgeMessage);

  if (badgeContainer) {
    badgeContainer.remove();
    badgeContainer = null;
    badgeIframe = null;
  }

  // Reset state
  currentBadgeState = { state: 'loading' };
  iframeReady = false;
}

/**
 * Hide badge (but keep it in DOM)
 */
export function hideBadge(): void {
  if (badgeContainer) {
    badgeContainer.style.display = 'none';
  }
}

/**
 * Show badge
 */
export function showBadge(): void {
  if (badgeContainer) {
    badgeContainer.style.display = 'block';
  }
}
