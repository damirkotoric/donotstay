import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { UserInfo } from '@donotstay/shared';

interface AuthStatus {
  authenticated: boolean;
  user: UserInfo | null;
}

function Popup() {
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [isOnHotelPage, setIsOnHotelPage] = useState(false);

  useEffect(() => {
    // Check auth status
    chrome.runtime.sendMessage({ type: 'GET_AUTH_STATUS' }, (response) => {
      setAuthStatus(response);
    });

    // Check if on hotel page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      setIsOnHotelPage(tab?.url?.includes('booking.com/hotel/') ?? false);
    });
  }, []);

  const handleAnalyze = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'TRIGGER_ANALYSIS' });
        window.close();
      }
    });
  };

  const handleSignIn = () => {
    // Open auth page in new tab
    chrome.tabs.create({ url: 'http://localhost:3000/auth/login' });
  };

  const handleUpgrade = () => {
    chrome.tabs.create({ url: 'http://localhost:3000/upgrade' });
  };

  if (authStatus === null) {
    return (
      <div className="popup">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="popup">
      <div className="header">
        <div className="logo">DoNotStay</div>
        <div className="tagline">AI hotel review analysis</div>
      </div>

      <div className="content">
        {isOnHotelPage ? (
          <button className="btn btn-primary" onClick={handleAnalyze}>
            Analyze This Hotel
          </button>
        ) : (
          <p className="info">Visit a hotel page on Booking.com to analyze reviews.</p>
        )}

        <div className="divider" />

        {authStatus.authenticated ? (
          <div className="user-info">
            <div className="email">{authStatus.user?.email}</div>
            <div className="subscription">
              {authStatus.user?.subscription_status === 'free' ? (
                <>
                  <span className="tier">Free tier</span>
                  <span className="remaining">
                    {authStatus.user.rate_limit.remaining} checks remaining
                  </span>
                </>
              ) : (
                <span className="tier pro">Pro</span>
              )}
            </div>
            {authStatus.user?.subscription_status === 'free' && (
              <button className="btn btn-secondary" onClick={handleUpgrade}>
                Upgrade to Pro
              </button>
            )}
          </div>
        ) : (
          <div className="auth-prompt">
            <p>Sign in for more hotel checks</p>
            <button className="btn btn-secondary" onClick={handleSignIn}>
              Sign In
            </button>
          </div>
        )}
      </div>

      <div className="footer">
        <a href="http://localhost:3000/privacy" target="_blank" rel="noopener">
          Privacy
        </a>
        <a href="http://localhost:3000/help" target="_blank" rel="noopener">
          Help
        </a>
      </div>
    </div>
  );
}

const container = document.getElementById('popup-root');
if (container) {
  const root = createRoot(container);
  root.render(<Popup />);
}
