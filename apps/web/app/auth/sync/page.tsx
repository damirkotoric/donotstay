'use client';

import { useEffect } from 'react';

// Minimal page that exists solely to sync auth to the extension.
// When loaded in a hidden iframe, the extension's auth-listener content script
// will run and sync any existing auth from localStorage to chrome.storage.
export default function AuthSyncPage() {
  useEffect(() => {
    // Post auth token if available (auth-listener will capture this)
    try {
      const stored = localStorage.getItem('donotstay_auth');
      if (stored) {
        const { access_token } = JSON.parse(stored);
        if (access_token) {
          window.postMessage({
            type: 'DONOTSTAY_AUTH',
            access_token,
          }, window.location.origin);
          console.log('DoNotStay: Auth sync page - token posted');
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }, []);

  // Return empty - this page is loaded in a hidden iframe
  return null;
}
