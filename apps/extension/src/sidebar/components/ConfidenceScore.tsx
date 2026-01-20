interface ConfidenceScoreProps {
  score: number;
  reviewCount: number;
}

function ConfidenceScore({ score, reviewCount }: ConfidenceScoreProps) {
  const getCircleStyles = () => {
    if (score >= 80) return 'bg-verdict-stay';
    if (score >= 60) return 'bg-verdict-depends';
    return 'bg-muted-foreground';
  };

  const getLabel = () => {
    if (score >= 80) return 'High confidence';
    if (score >= 60) return 'Moderate confidence';
    return 'Low confidence';
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-muted rounded-xl">
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white ${getCircleStyles()}`}
      >
        {score}%
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-foreground">{getLabel()}</div>
        <div className="text-[13px] text-muted-foreground">
          Based on {reviewCount} detailed review{reviewCount !== 1 ? 's' : ''}
        </div>
        <div className="text-[11px] text-muted-foreground/70 mt-0.5">
          Score-only reviews excluded
        </div>
      </div>
    </div>
  );
}

export default ConfidenceScore;
