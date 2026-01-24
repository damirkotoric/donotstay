// Use Vite env vars for dev mode (set in .env.development / .env.production)
const DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';
const DEV_SERVER_URL = import.meta.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function getIframeUrl(path: string): string {
  return DEV_MODE ? `${DEV_SERVER_URL}/${path}` : chrome.runtime.getURL(path);
}

export type ButtonState = 'idle' | 'loading' | 'analyzing' | 'stay' | 'depends' | 'do_not_stay' | 'error' | 'rate_limited';

export interface ButtonPayload {
  state: ButtonState;
  message?: string;
  credits_remaining?: number;
}

let buttonContainer: HTMLElement | null = null;
let buttonIframe: HTMLIFrameElement | null = null;
let clickCallback: (() => void) | null = null;

/**
 * Inject the floating button iframe into the page
 */
export function injectButton(onClick: () => void): void {
  clickCallback = onClick;

  // Remove existing button if present
  removeButton();

  const iframeUrl = getIframeUrl('src/button/index.html');
  console.log('DoNotStay: Injecting button iframe with URL:', iframeUrl);

  // Create container
  buttonContainer = document.createElement('div');
  buttonContainer.id = 'donotstay-button-container';

  // Create iframe
  buttonIframe = document.createElement('iframe');
  buttonIframe.id = 'donotstay-button-iframe';
  buttonIframe.src = iframeUrl;

  buttonContainer.appendChild(buttonIframe);
  document.body.appendChild(buttonContainer);

  console.log('DoNotStay: Button container appended to body');

  // Listen for messages from button iframe
  window.addEventListener('message', handleButtonMessage);
}

/**
 * Handle messages from button iframe
 */
function handleButtonMessage(event: MessageEvent): void {
  if (event.data?.type === 'DONOTSTAY_BUTTON_CLICK') {
    if (clickCallback) {
      clickCallback();
    }
  }
}

/**
 * Update button state
 */
export function updateButton(payload: ButtonPayload): void {
  console.log('DoNotStay: updateButton called with:', payload.state, 'buttonIframe:', !!buttonIframe, 'contentWindow:', !!buttonIframe?.contentWindow);
  if (buttonIframe?.contentWindow) {
    buttonIframe.contentWindow.postMessage(
      { type: 'DONOTSTAY_BUTTON_UPDATE', payload },
      '*'
    );
  } else {
    console.warn('DoNotStay: buttonIframe or contentWindow is null, cannot update button');
  }
}

/**
 * Remove button from page
 */
export function removeButton(): void {
  window.removeEventListener('message', handleButtonMessage);

  if (buttonContainer) {
    buttonContainer.remove();
    buttonContainer = null;
    buttonIframe = null;
  }
}
