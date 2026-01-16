import type { AnalyzeResponse, RateLimitInfo } from '@donotstay/shared';
import { hideBadge, showBadge } from './badge';

// Use Vite env vars for dev mode (set in .env.development / .env.production)
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';
const DEV_SERVER_URL = import.meta.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function getIframeUrl(path: string): string {
  return DEV_MODE ? `${DEV_SERVER_URL}/${path}` : chrome.runtime.getURL(path);
}

interface VerdictUpdate {
  type: 'verdict';
  verdict: AnalyzeResponse;
}

interface RateLimitedUpdate {
  type: 'rate_limited';
  rate_limit?: RateLimitInfo;
}

interface ErrorUpdate {
  type: 'error';
  message: string;
}

interface LoadingUpdate {
  type: 'loading';
}

export type SidebarUpdate = VerdictUpdate | RateLimitedUpdate | ErrorUpdate | LoadingUpdate;

let sidebarContainer: HTMLElement | null = null;
let sidebarIframe: HTMLIFrameElement | null = null;
let backdrop: HTMLElement | null = null;
let closeCallback: (() => void) | null = null;
let currentSidebarState: SidebarUpdate = { type: 'loading' };
let sidebarReady = false;

// ESC key handler
function handleEscKey(event: KeyboardEvent): void {
  if (event.key === 'Escape' && sidebarContainer?.classList.contains('visible')) {
    hideSidebar();
    if (closeCallback) closeCallback();
  }
}

// Handle ready message from sidebar iframe
function handleSidebarMessage(event: MessageEvent): void {
  if (event.data?.type === 'DONOTSTAY_SIDEBAR_READY') {
    sidebarReady = true;
    // Send current state to sidebar
    if (sidebarIframe?.contentWindow) {
      sidebarIframe.contentWindow.postMessage(
        { type: 'DONOTSTAY_UPDATE', payload: currentSidebarState },
        '*'
      );
    }
  }
}

/**
 * Inject sidebar iframe into the page
 */
export function injectSidebar(onClose: () => void): void {
  closeCallback = onClose;

  // Create backdrop
  backdrop = document.createElement('div');
  backdrop.id = 'donotstay-backdrop';
  backdrop.addEventListener('click', () => {
    hideSidebar();
    if (closeCallback) closeCallback();
  });
  document.body.appendChild(backdrop);

  // Create container
  sidebarContainer = document.createElement('div');
  sidebarContainer.id = 'donotstay-sidebar-container';

  // Create iframe
  sidebarIframe = document.createElement('iframe');
  sidebarIframe.id = 'donotstay-sidebar-iframe';
  sidebarIframe.src = getIframeUrl('src/sidebar/index.html');

  sidebarContainer.appendChild(sidebarIframe);
  document.body.appendChild(sidebarContainer);

  // Listen for ESC key to close sidebar
  document.addEventListener('keydown', handleEscKey);

  // Listen for ready message from sidebar iframe
  window.addEventListener('message', handleSidebarMessage);
}

/**
 * Show the sidebar
 */
export function showSidebar(): void {
  if (sidebarContainer) {
    sidebarContainer.classList.add('visible');
  }
  if (backdrop) {
    backdrop.classList.add('visible');
  }
  // Prevent page scrolling when sidebar is open
  document.body.style.overflow = 'hidden';
  // Hide the badge when sidebar is open
  hideBadge();
}

/**
 * Hide the sidebar
 */
export function hideSidebar(): void {
  if (sidebarContainer) {
    sidebarContainer.classList.remove('visible');
  }
  if (backdrop) {
    backdrop.classList.remove('visible');
  }
  // Restore page scrolling when sidebar is closed
  document.body.style.overflow = '';
  // Show the badge again when sidebar is closed
  showBadge();
}

/**
 * Update sidebar content by posting message to iframe
 */
export function updateSidebar(update: SidebarUpdate): void {
  // Always store the state so we can send it when iframe is ready
  currentSidebarState = update;

  // Only send if iframe is ready
  if (sidebarReady && sidebarIframe?.contentWindow) {
    sidebarIframe.contentWindow.postMessage(
      { type: 'DONOTSTAY_UPDATE', payload: update },
      '*'
    );
  }
}

/**
 * Remove sidebar from page
 */
export function removeSidebar(): void {
  window.removeEventListener('message', handleSidebarMessage);

  if (sidebarContainer) {
    sidebarContainer.remove();
    sidebarContainer = null;
    sidebarIframe = null;
  }
  if (backdrop) {
    backdrop.remove();
    backdrop = null;
  }

  // Reset state
  currentSidebarState = { type: 'loading' };
  sidebarReady = false;
}
