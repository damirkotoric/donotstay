interface ConfidenceScoreProps {
  score: number;
  reviewCount: number;
}

function ConfidenceScore({ score, reviewCount }: ConfidenceScoreProps) {
  const getCircleStyles = () => {
    if (score >= 80) return 'bg-gradient-to-br from-emerald-500 to-emerald-600';
    if (score >= 60) return 'bg-gradient-to-br from-amber-500 to-amber-600';
    return 'bg-gradient-to-br from-gray-500 to-gray-600';
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
