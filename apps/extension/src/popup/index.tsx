import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../globals.css';
import './styles.css';
import type { UserInfo } from '@donotstay/shared';

interface AnonymousInfo {
  deviceId: string;
  checksUsed: number;
  checksRemaining: number;
}

interface AuthStatus {
  authenticated: boolean;
  user: UserInfo | null;
  anonymous?: AnonymousInfo | null;
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

  const handleBuyCredits = () => {
    chrome.tabs.create({ url: 'http://localhost:3000/#pricing' });
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
            <div className="credits">
              <span className="balance">
                {authStatus.user?.credits_remaining ?? 0} checks remaining
              </span>
            </div>
            {(authStatus.user?.credits_remaining ?? 0) === 0 && (
              <button className="btn btn-primary" onClick={handleBuyCredits}>
                Buy Credits
              </button>
            )}
            {(authStatus.user?.credits_remaining ?? 0) > 0 && !authStatus.user?.has_purchased && (
              <button className="btn btn-secondary" onClick={handleBuyCredits}>
                Get More Credits
              </button>
            )}
          </div>
        ) : (
          <div className="auth-prompt">
            {authStatus.anonymous && (
              <div className="anonymous-status">
                <span className="remaining">
                  {authStatus.anonymous.checksRemaining} free {authStatus.anonymous.checksRemaining === 1 ? 'check' : 'checks'} remaining
                </span>
              </div>
            )}
            <p>Sign up free to get 5 more checks</p>
            <button className="btn btn-secondary" onClick={handleSignIn}>
              Sign Up Free
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
