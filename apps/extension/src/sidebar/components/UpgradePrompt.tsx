import React from 'react';
import type { RateLimitInfo } from '@donotstay/shared';

interface UpgradePromptProps {
  rateLimit?: RateLimitInfo;
}

function UpgradePrompt({ rateLimit }: UpgradePromptProps) {
  const handleUpgrade = () => {
    window.open('http://localhost:3000/upgrade', '_blank');
  };

  const getResetTime = () => {
    if (!rateLimit?.reset_at) return null;

    const resetDate = new Date(rateLimit.reset_at);
    const now = new Date();
    const diffMs = resetDate.getTime() - now.getTime();
    const diffMins = Math.ceil(diffMs / 60000);

    if (diffMins <= 0) return 'Resets soon';
    if (diffMins < 60) return `Resets in ${diffMins} minute${diffMins !== 1 ? 's' : ''}`;

    const diffHours = Math.ceil(diffMins / 60);
    return `Resets in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  };

  return (
    <div className="upgrade-prompt">
      <div className="upgrade-icon">&#128274;</div>
      <div className="upgrade-title">Check Limit Reached</div>
      <div className="upgrade-message">
        You've used all your free hotel checks.
        <br />
        Upgrade to Pro for unlimited analysis.
      </div>
      <button className="upgrade-btn" onClick={handleUpgrade}>
        Upgrade to Pro — $5/month
      </button>
      {rateLimit && (
        <div className="reset-time">{getResetTime()}</div>
      )}
    </div>
  );
}

export default UpgradePrompt;
