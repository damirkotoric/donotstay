import React, { useEffect, useState } from 'react';
import type { AnalyzeResponse, RateLimitInfo } from '@donotstay/shared';
import VerdictCard from './components/VerdictCard';
import RedFlags from './components/RedFlags';
import AvoidIfPersonas from './components/AvoidIfPersonas';
import ConfidenceScore from './components/ConfidenceScore';
import LoadingState from './components/LoadingState';
import ErrorState from './components/ErrorState';
import UpgradePrompt from './components/UpgradePrompt';

type ViewState =
  | { type: 'loading' }
  | { type: 'verdict'; verdict: AnalyzeResponse }
  | { type: 'rate_limited'; rate_limit?: RateLimitInfo }
  | { type: 'error'; message: string };

function App() {
  const [state, setState] = useState<ViewState>({ type: 'loading' });

  useEffect(() => {
    // Listen for messages from content script
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DONOTSTAY_UPDATE') {
        setState(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleClose = () => {
    window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*');
  };

  return (
    <div className="sidebar">
      <header className="sidebar-header">
        <div className="logo">DoNotStay</div>
        <button className="close-btn" onClick={handleClose}>
          &times;
        </button>
      </header>

      <main className="sidebar-content">
        {state.type === 'loading' && <LoadingState />}

        {state.type === 'error' && <ErrorState message={state.message} />}

        {state.type === 'rate_limited' && (
          <UpgradePrompt rateLimit={state.rate_limit} />
        )}

        {state.type === 'verdict' && (
          <>
            <VerdictCard
              verdict={state.verdict.verdict}
              oneLiner={state.verdict.one_liner}
            />

            <ConfidenceScore
              score={state.verdict.confidence}
              reviewCount={state.verdict.review_count_analyzed}
            />

            {state.verdict.red_flags.length > 0 && (
              <RedFlags flags={state.verdict.red_flags} />
            )}

            {state.verdict.avoid_if_you_are.length > 0 && (
              <AvoidIfPersonas personas={state.verdict.avoid_if_you_are} />
            )}

            <section className="bottom-line">
              <h3>The Bottom Line</h3>
              <p>{state.verdict.bottom_line}</p>
            </section>

            {state.verdict.cached && (
              <div className="cached-notice">
                Analysis from cache
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
