import { useEffect, useState } from 'react';
import { Button } from '@donotstay/ui';
import { ThumbsUp, ThumbsDown, HandPalm, Warning, Lock } from '@phosphor-icons/react';

type ButtonState = 'idle' | 'loading' | 'analyzing' | 'stay' | 'depends' | 'do_not_stay' | 'error' | 'rate_limited';

interface ButtonData {
  state: ButtonState;
  message?: string;
  credits_remaining?: number;
}

const LOADING_MESSAGES = [
  'Loading...',
  'Checking...',
  'Peeking...',
  'Judging...',
  'Scanning...',
  'Vibing...',
];

function App() {
  const [data, setData] = useState<ButtonData>({ state: 'loading' });
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DONOTSTAY_BUTTON_UPDATE') {
        setData(event.data.payload || { state: event.data.state });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Rotate loading messages when analyzing
  useEffect(() => {
    if (data.state === 'analyzing') {
      setLoadingMessageIndex(0); // Reset to "Loading..." when entering analyzing state
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 4000); // Change every 4 seconds

      return () => clearInterval(interval);
    }
  }, [data.state]);

  const handleClick = () => {
    window.parent.postMessage({ type: 'DONOTSTAY_BUTTON_CLICK' }, '*');
  };

  const getIcon = () => {
    switch (data.state) {
      case 'stay':
        return ThumbsUp;
      case 'depends':
        return HandPalm;
      case 'do_not_stay':
        return ThumbsDown;
      case 'error':
        return Warning;
      case 'rate_limited':
        return Lock;
      default:
        return undefined;
    }
  };

  const getText = () => {
    switch (data.state) {
      case 'analyzing':
        return LOADING_MESSAGES[loadingMessageIndex];
      case 'stay':
        return 'Stay';
      case 'depends':
        return 'Questionable';
      case 'do_not_stay':
        return 'Do Not Stay';
      case 'error':
        return data.message || 'Error';
      case 'rate_limited':
        return data.message || 'Get credits';
      default:
        return 'Check';
    }
  };

  const getVariant = () => {
    switch (data.state) {
      case 'stay':
        return 'stay';
      case 'depends':
        return 'depends';
      case 'do_not_stay':
        return 'donotstay';
      default:
        return 'outline';
    }
  };

  const isIdle = data.state === 'idle';
  const isLoading = data.state === 'loading';
  const isAnalyzing = data.state === 'analyzing';
  const showCredits = isIdle && data.credits_remaining !== undefined && data.credits_remaining > 0;

  // Show skeleton loader for initial loading state
  if (isLoading) {
    return (
      <div className="pr-4 pb-4">
        <div className="h-10 w-32 rounded-md bg-gradient-to-r from-muted via-muted-foreground/20 to-muted bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] shadow-lg" />
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="pr-4 pb-4">
      <Button
        onClick={handleClick}
        loading={isAnalyzing}
        size="lg"
        leadingIcon={getIcon()}
        iconWeight="bold"
        variant={getVariant()}
        className="shadow-lg disabled:opacity-100"
      >
        {isIdle && (
          <div className="relative size-5">
            <ThumbsDown weight="fill" className="absolute bottom-0 right-0 size-3.5 text-verdict-donotstay" />
            <ThumbsUp weight="fill" className="absolute top-0 left-0 size-3.5 text-verdict-stay [filter:drop-shadow(1px_0_0_var(--color-background))_drop-shadow(-1px_0_0_var(--color-background))_drop-shadow(0_1px_0_var(--color-background))_drop-shadow(0_-1px_0_var(--color-background))]" />
          </div>
        )}
        <span>{getText()}</span>
        {showCredits && (
          <span className="ml-1.5 px-2 py-0.5 text-xs font-medium border rounded-full">
            {data.credits_remaining} left
          </span>
        )}
      </Button>
    </div>
  );
}

export default App;
