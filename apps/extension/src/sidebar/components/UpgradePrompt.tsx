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
    <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
      <div className="text-5xl mb-4">&#128274;</div>
      <div className="text-xl font-bold text-foreground mb-2">Check Limit Reached</div>
      <div className="text-sm text-muted-foreground mb-6">
        You've used all your free hotel checks.
        <br />
        Upgrade to Pro for unlimited analysis.
      </div>
      <button
        className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-none py-3.5 px-7 rounded-xl text-[15px] font-semibold cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/30"
        onClick={handleUpgrade}
      >
        Upgrade to Pro — $5/month
      </button>
      {rateLimit && (
        <div className="text-[13px] text-muted-foreground mt-4">{getResetTime()}</div>
      )}
    </div>
  );
}

export default UpgradePrompt;
