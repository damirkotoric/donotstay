import React from 'react';

function LoadingState() {
  return (
    <div className="loading-state">
      <div className="loading-spinner" />
      <div className="loading-text">Analyzing reviews...</div>
    </div>
  );
}

export default LoadingState;
