// Content script that runs on donotstay.app to capture auth tokens
// and relay them to the extension's background script

window.addEventListener('message', (event) => {
  // Only accept messages from the same origin
  if (event.origin !== window.location.origin) return;

  if (event.data?.type === 'DONOTSTAY_AUTH' && event.data?.access_token) {
    // Relay to background script
    chrome.runtime.sendMessage({
      type: 'STORE_AUTH_TOKEN',
      token: event.data.access_token,
    });
    console.log('DoNotStay: Auth token captured from web login');
  }
});

console.log('DoNotStay: Auth listener ready on', window.location.origin);
