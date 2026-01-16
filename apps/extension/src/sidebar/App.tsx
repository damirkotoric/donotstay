import { useEffect, useState } from 'react';
import { ArrowSquareOutIcon } from '@phosphor-icons/react';
import type { AnalyzeResponse, RateLimitInfo } from '@donotstay/shared';
import VerdictCard from './components/VerdictCard';
import CollapsibleText from './components/CollapsibleText';
import RedFlags from './components/RedFlags';
import AvoidIfPersonas from './components/AvoidIfPersonas';
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

    // Tell content script we're ready to receive state
    window.parent.postMessage({ type: 'DONOTSTAY_SIDEBAR_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 p-8 flex flex-col gap-8 overflow-y-auto">
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
              confidenceScore={state.verdict.confidence}
              reviewCount={state.verdict.review_count_analyzed}
            />

            <CollapsibleText text={state.verdict.bottom_line} />

            <RedFlags
              flags={state.verdict.red_flags}
              reviewCount={state.verdict.review_count_analyzed}
            />

            {state.verdict.avoid_if_you_are.length > 0 && (
              <AvoidIfPersonas personas={state.verdict.avoid_if_you_are} />
            )}

            {state.verdict.cached && (
              <div className="text-center text-xs text-muted-foreground py-2">
                Analysis from cache
              </div>
            )}
          </>
        )}
      </main>

      <footer className="px-5 py-8 text-center text-xs text-muted-foreground">
        AI-generated analysis. Not a substitute for reading actual reviews.{' '}
        <a
          href="https://donotstay.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 underline hover:text-foreground transition-colors"
        >
          donotstay.app
          <ArrowSquareOutIcon size={12} weight="bold" />
        </a>
      </footer>
    </div>
  );
}

export default App;
