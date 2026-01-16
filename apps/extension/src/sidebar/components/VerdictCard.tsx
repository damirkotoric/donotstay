import type { Verdict } from '@donotstay/shared';
import { ThumbsDown } from '@phosphor-icons/react';

interface VerdictCardProps {
  verdict: Verdict;
  oneLiner: string;
  confidenceScore: number;
  reviewCount: number;
}

function VerdictCard({ verdict, oneLiner, confidenceScore, reviewCount }: VerdictCardProps) {
  const getStyles = () => {
    switch (verdict) {
      case 'Stay':
        return 'bg-verdict-stay-light text-verdict-stay';
      case 'Questionable':
        return 'bg-verdict-depends-light text-verdict-depends';
      case 'Do Not Stay':
        return 'bg-verdict-donotstay-light text-verdict-donotstay';
      default:
        return 'bg-verdict-depends-light text-verdict-depends';
    }
  };

  const getConfidenceLabel = () => {
    if (confidenceScore >= 80) return 'High confidence in verdict.';
    if (confidenceScore >= 60) return 'Moderate confidence in verdict.';
    return 'Low confidence in verdict.';
  };

  return (
    <div className={`rounded-2xl overflow-hidden ${getStyles()}`}>
      <div className="p-6">
        <div>
          {verdict === 'Do Not Stay' ? (
            <div className="inline-flex items-center gap-2 bg-verdict-donotstay text-white px-3 py-1.5 rounded-full mb-3">
              <ThumbsDown weight="bold" className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-bold">{verdict}</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-1">
              <ThumbsDown weight="bold" className="w-8 h-8 flex-shrink-0" />
              <div className="text-lg font-bold">{verdict}</div>
            </div>
          )}
          <div className="text-3xl font-black">{oneLiner}</div>
        </div>
        <div className="flex text-foreground items-center mt-6 border-t border-black/12 pt-4 gap-6">
          <div
            className="text-4xl font-bold"
          >
            {confidenceScore}%
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold">{getConfidenceLabel()}</div>
            <div className="text-[13px] opacity-70">
              Based on {reviewCount} detailed review{reviewCount !== 1 ? 's' : ''}. Score-only reviews excluded.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerdictCard;
