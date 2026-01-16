import React, { useEffect, useState } from 'react';

type ButtonState = 'idle' | 'loading';

function App() {
  const [state, setState] = useState<ButtonState>('idle');

  useEffect(() => {
    // Listen for messages from content script
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'DONOTSTAY_BUTTON_UPDATE') {
        setState(event.data.state);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleClick = () => {
    // Notify content script that button was clicked
    window.parent.postMessage({ type: 'DONOTSTAY_BUTTON_CLICK' }, '*');
  };

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className="check-button"
    >
      {state === 'loading' ? (
        <>
          <svg
            className="spinner"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="spinner-track"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="spinner-head"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Analyzing...
        </>
      ) : (
        <>
          <svg
            className="search-icon"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          Check accommodation
        </>
      )}
    </button>
  );
}

export default App;
