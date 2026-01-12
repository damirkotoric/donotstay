import React from 'react';

function AuthPrompt() {
  const handleSignIn = () => {
    window.open('http://localhost:3000/auth/login', '_blank');
  };

  return (
    <div className="upgrade-prompt">
      <div className="upgrade-icon">&#128100;</div>
      <div className="upgrade-title">Sign In Required</div>
      <div className="upgrade-message">
        Sign in to analyze hotels and track your checks.
      </div>
      <button className="upgrade-btn" onClick={handleSignIn}>
        Sign In with Email
      </button>
    </div>
  );
}

export default AuthPrompt;
