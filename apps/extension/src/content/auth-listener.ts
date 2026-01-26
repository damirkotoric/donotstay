// Content script that runs on donotstay.app to capture auth tokens
// and relay them to the extension's background script

// Notify parent window (if in iframe) that auth sync is complete
function notifyAuthSyncComplete(hasToken: boolean) {
  if (window.parent !== window) {
    // We're in an iframe - notify parent window
    window.parent.postMessage({
      type: 'DONOTSTAY_AUTH_SYNC_COMPLETE',
      hasToken,
    }, '*');
  }
}

// Listen for auth messages from the page
window.addEventListener('message', (event) => {
  // Only accept messages from the same origin
  if (event.origin !== window.location.origin) return;

  if (event.data?.type === 'DONOTSTAY_AUTH' && event.data?.access_token) {
    // Relay to background script
    chrome.runtime.sendMessage({
      type: 'STORE_AUTH_TOKEN',
      token: event.data.access_token,
    }).then(() => {
      console.log('DoNotStay: Auth token captured from web login');
      notifyAuthSyncComplete(true);
    });
  }

  if (event.data?.type === 'DONOTSTAY_LOGOUT') {
    // Clear extension storage
    chrome.runtime.sendMessage({
      type: 'CLEAR_AUTH_TOKEN',
    }).then(() => {
      console.log('DoNotStay: Auth token cleared via logout');
    });
  }
});

// Check localStorage for existing auth on page load
// This syncs auth if user logged in before the extension was installed
// Skip on logout page to avoid re-syncing token that's about to be cleared
(async () => {
  if (window.location.pathname === '/auth/logout') {
    notifyAuthSyncComplete(false);
    return;
  }

  try {
    const stored = localStorage.getItem('donotstay_auth');
    if (stored) {
      const { access_token } = JSON.parse(stored);
      if (access_token) {
        await chrome.runtime.sendMessage({
          type: 'STORE_AUTH_TOKEN',
          token: access_token,
        });
        console.log('DoNotStay: Auth token synced from localStorage');
        notifyAuthSyncComplete(true);
        return;
      }
    }
  } catch {
    // Ignore parsing errors
  }
  // No token found
  notifyAuthSyncComplete(false);
})();

console.log('DoNotStay: Auth listener ready on', window.location.origin);
