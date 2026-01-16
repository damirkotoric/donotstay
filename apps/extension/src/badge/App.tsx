import React, { useEffect, useState } from 'react';
import { ThumbsUp, Question, ThumbsDown } from '@phosphor-icons/react';

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
    // Listen for messages from content script
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DONOTSTAY_BADGE_UPDATE') {
        setData(event.data.payload);
      }
    };

    window.addEventListener('message', handleMessage);

    // Tell the content script we're ready to receive updates
    window.parent.postMessage({ type: 'DONOTSTAY_BADGE_READY' }, '*');

    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleClick = () => {
    // Notify content script that badge was clicked
    window.parent.postMessage({ type: 'DONOTSTAY_BADGE_CLICK' }, '*');
  };

  const renderContent = () => {
    switch (data.state) {
      case 'loading':
        return (
          <>
            <div className="spinner" />
            <span className="text">Analyzing...</span>
          </>
        );

      case 'stay':
        return (
          <>
            <ThumbsUp weight="bold" className="icon" />
            <span className="text">Stay</span>
            {data.confidence && <span className="confidence">{data.confidence}%</span>}
          </>
        );

      case 'depends':
        return (
          <>
            <Question weight="bold" className="icon" />
            <span className="text">Questionable</span>
            {data.confidence && <span className="confidence">{data.confidence}%</span>}
          </>
        );

      case 'do_not_stay':
        return (
          <>
            <ThumbsDown weight="bold" className="icon" />
            <span className="text">Do Not Stay</span>
            {data.confidence && <span className="confidence">{data.confidence}%</span>}
          </>
        );

      case 'error':
        return (
          <>
            <span className="icon">!</span>
            <span className="text">{data.message || 'Error'}</span>
          </>
        );

      case 'rate_limited':
        return (
          <>
            <span className="icon">&#128274;</span>
            <span className="text">Limit reached</span>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`badge ${data.state}`} onClick={handleClick}>
      {renderContent()}
    </div>
  );
}

export default App;
