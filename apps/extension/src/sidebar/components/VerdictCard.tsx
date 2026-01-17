import type { Verdict } from '@donotstay/shared';
import { AnimatedCircularProgressBar } from '@donotstay/ui';
import { ThumbsDown, ThumbsUp, Question } from '@phosphor-icons/react';

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
    if (confidenceScore >= 80) return 'High confidence.';
    if (confidenceScore >= 60) return 'Moderate confidence.';
    return 'Low confidence.';
  };

  const getProgressColors = () => {
    switch (verdict) {
      case 'Stay':
        return { primary: 'var(--color-verdict-stay)', secondary: 'var(--color-verdict-stay-light)', text: 'var(--color-foreground)' };
      case 'Questionable':
        return { primary: 'var(--color-verdict-depends)', secondary: 'var(--color-verdict-depends-light)', text: 'var(--color-foreground)' };
      case 'Do Not Stay':
        return { primary: 'var(--color-verdict-donotstay)', secondary: 'var(--color-verdict-donotstay-light)', text: 'var(--color-foreground)' };
      default:
        return { primary: 'var(--color-muted-foreground)', secondary: 'var(--color-muted)', text: 'var(--color-foreground)' };
    }
  };

  const progressColors = getProgressColors();

  return (
    <div className={`border shadow-md rounded-2xl overflow-hidden ${getStyles()}`}>
      <div className="p-6">
        <div>
          <div className={`inline-flex items-center gap-2 text-white px-3 py-1.5 rounded-full mb-3 ${
            verdict === 'Stay' ? 'bg-verdict-stay' :
            verdict === 'Questionable' ? 'bg-verdict-depends' :
            'bg-verdict-donotstay'
          }`}>
            {verdict === 'Stay' ? (
              <ThumbsUp weight="bold" className="w-5 h-5 flex-shrink-0" />
            ) : verdict === 'Questionable' ? (
              <Question weight="bold" className="w-5 h-5 flex-shrink-0" />
            ) : (
              <ThumbsDown weight="bold" className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="text-sm font-bold">{verdict}</span>
          </div>
          <div className="text-3xl font-black">{oneLiner}</div>
        </div>
        <div className="relative flex text-foreground items-center mt-4 pt-4 gap-4">
          <AnimatedCircularProgressBar
            value={confidenceScore}
            min={0}
            max={100}
            gaugePrimaryColor={progressColors.primary}
            gaugeSecondaryColor={progressColors.secondary}
            textColor={progressColors.text}
            className="size-20 text-lg flex-none"
          />
          <div className="text-[13px]">
            <div className="text-sm font-semibold">{getConfidenceLabel()}</div>
            <div className="text-muted-foreground">
              Based on {reviewCount} detailed review{reviewCount !== 1 ? 's' : ''}.
            </div>
            <div className="text-muted-foreground">
              Score-only reviews are excluded.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerdictCard;
