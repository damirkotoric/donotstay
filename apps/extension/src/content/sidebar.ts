import type { AnalyzeResponse, RateLimitInfo } from '@donotstay/shared';

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
  sidebarIframe.src = chrome.runtime.getURL('sidebar/index.html');

  sidebarContainer.appendChild(sidebarIframe);
  document.body.appendChild(sidebarContainer);
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
}

/**
 * Update sidebar content by posting message to iframe
 */
export function updateSidebar(update: SidebarUpdate): void {
  if (sidebarIframe?.contentWindow) {
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
  if (sidebarContainer) {
    sidebarContainer.remove();
    sidebarContainer = null;
    sidebarIframe = null;
  }
  if (backdrop) {
    backdrop.remove();
    backdrop = null;
  }
}
