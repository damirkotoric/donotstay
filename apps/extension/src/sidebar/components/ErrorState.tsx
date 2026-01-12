import React from 'react';

interface ErrorStateProps {
  message: string;
}

function ErrorState({ message }: ErrorStateProps) {
  const handleRetry = () => {
    window.parent.postMessage({ type: 'RETRY_ANALYSIS' }, '*');
  };

  return (
    <div className="error-state">
      <div className="error-icon">!</div>
      <div className="error-message">{message}</div>
      <button className="upgrade-btn" onClick={handleRetry}>
        Try Again
      </button>
    </div>
  );
}

export default ErrorState;
