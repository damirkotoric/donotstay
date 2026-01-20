function UpgradeBanner() {
  const handleUpgrade = () => {
    window.open('http://localhost:3000/upgrade', '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-violet-500/10 to-violet-600/10 border border-violet-500/20 rounded-xl p-4 text-center">
      <p className="text-sm font-semibold text-foreground mb-1">
        Unlock full analysis
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        See all red flags, personas, and get unlimited checks
      </p>
      <button
        onClick={handleUpgrade}
        className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Upgrade to Pro
      </button>
    </div>
  );
}

export default UpgradeBanner;
