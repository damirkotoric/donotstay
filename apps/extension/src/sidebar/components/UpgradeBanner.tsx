import { Button } from '@donotstay/ui';

function UpgradeBanner() {
  const handleUpgrade = () => {
    window.open('http://localhost:3000/upgrade', '_blank');
  };

  return (
    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
      <p className="text-sm font-semibold text-foreground mb-1">
        Unlock full analysis
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        See all red flags, personas, and get unlimited checks
      </p>
      <Button size="sm" onClick={handleUpgrade}>
        Upgrade to Pro
      </Button>
    </div>
  );
}

export default UpgradeBanner;
