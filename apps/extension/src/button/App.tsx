import { useEffect, useState } from 'react';
import { Button } from '@donotstay/ui';
import { ThumbsUp, ThumbsDown, Question, Warning, Lock } from '@phosphor-icons/react';

type ButtonState = 'idle' | 'loading' | 'stay' | 'depends' | 'do_not_stay' | 'error' | 'rate_limited';

interface ButtonData {
  state: ButtonState;
  message?: string;
}

function App() {
  const [data, setData] = useState<ButtonData>({ state: 'idle' });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DONOTSTAY_BUTTON_UPDATE') {
        setData(event.data.payload || { state: event.data.state });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleClick = () => {
    window.parent.postMessage({ type: 'DONOTSTAY_BUTTON_CLICK' }, '*');
  };

  const getIcon = () => {
    switch (data.state) {
      case 'stay':
        return ThumbsUp;
      case 'depends':
        return Question;
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
      case 'loading':
        return 'Analyzing...';
      case 'stay':
        return 'Stay';
      case 'depends':
        return 'Questionable';
      case 'do_not_stay':
        return 'Do Not Stay';
      case 'error':
        return data.message || 'Error';
      case 'rate_limited':
        return 'Limit reached';
      default:
        return 'Check accommodation';
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

  return (
    <div className="pr-4 pb-4">
      <Button
        onClick={handleClick}
        loading={isLoading}
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
      </Button>
    </div>
  );
}

export default App;
