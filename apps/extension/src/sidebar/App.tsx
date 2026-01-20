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
import UpgradeBanner from './components/UpgradeBanner';
import SignupPrompt from './components/SignupPrompt';

type ViewState =
  | { type: 'loading' }
  | { type: 'verdict'; verdict: AnalyzeResponse }
  | { type: 'rate_limited'; rate_limit?: RateLimitInfo; tier?: 'anonymous' | 'authenticated' }
  | { type: 'error'; message: string };

function App() {
  const [state, setState] = useState<ViewState>({ type: 'loading' });

  useEffect(() => {
    // Listen for messages from content script
    const handleMessage = (event: MessageEvent) => {
      console.log('DoNotStay Sidebar: Received message', event.data);
      if (event.data?.type === 'DONOTSTAY_UPDATE') {
        console.log('DoNotStay Sidebar: Updating state to', event.data.payload.type);
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
          state.tier === 'anonymous' ? (
            <SignupPrompt />
          ) : (
            <UpgradePrompt rateLimit={state.rate_limit} />
          )
        )}

        {state.type === 'verdict' && (
          <>
            <VerdictCard
              verdict={state.verdict.verdict}
              oneLiner={state.verdict.one_liner}
              confidenceScore={state.verdict.confidence}
              reviewCount={state.verdict.review_count_analyzed}
            />

            {/* Summary paragraph - shown with blur effect for free users */}
            {state.verdict.bottom_line && (
              <CollapsibleText
                text={state.verdict.bottom_line}
                isBlurred={state.verdict.is_blurred}
              />
            )}

            {/* Show upgrade banner for blurred content */}
            {state.verdict.is_blurred && <UpgradeBanner />}

            <RedFlags
              flags={state.verdict.red_flags}
              reviewCount={state.verdict.review_count_analyzed}
              visibleCount={state.verdict.red_flags_visible_count}
            />

            {state.verdict.avoid_if_you_are.length > 0 && (
              <AvoidIfPersonas
                personas={state.verdict.avoid_if_you_are}
                visibleCount={state.verdict.avoid_if_visible_count}
              />
            )}

            {state.verdict.analyzed_at && !state.verdict.is_blurred && (
              <div className="text-center text-xs text-muted-foreground py-2">
                Analyzed on {new Date(state.verdict.analyzed_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
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
