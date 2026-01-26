import { useEffect, useState } from 'react';
import { Button } from '@donotstay/ui';
import { ThumbsUp, HandPalm, ThumbsDown, Warning, Lock } from '@phosphor-icons/react';

type BadgeState = 'loading' | 'stay' | 'depends' | 'do_not_stay' | 'error' | 'rate_limited';

interface BadgeData {
  state: BadgeState;
  verdict?: string;
  confidence?: number;
  message?: string;
}

function App() {
  const [data, setData] = useState<BadgeData>({ state: 'loading' });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DONOTSTAY_BADGE_UPDATE') {
        setData(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);
    window.parent.postMessage({ type: 'DONOTSTAY_BADGE_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleClick = () => {
    window.parent.postMessage({ type: 'DONOTSTAY_BADGE_CLICK' }, '*');
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
      case 'loading':
        return 'Analyzing...';
      case 'stay':
        return `Stay`;
      case 'depends':
        return `Questionable`;
      case 'do_not_stay':
        return `Do Not Stay`;
      case 'error':
        return data.message || 'Error';
      case 'rate_limited':
        return 'Limit reached';
      default:
        return '';
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

  return (
    <Button
      onClick={handleClick}
      loading={data.state === 'loading'}
      size="lg"
      leadingIcon={getIcon()}
      iconWeight="bold"
      variant={getVariant()}
      className="disabled:opacity-100"
    >
      <span>{getText()}</span>
    </Button>
  );
}

export default App;
