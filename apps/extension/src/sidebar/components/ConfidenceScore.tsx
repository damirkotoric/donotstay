import React from 'react';

interface ConfidenceScoreProps {
  score: number;
  reviewCount: number;
}

function ConfidenceScore({ score, reviewCount }: ConfidenceScoreProps) {
  const getLevel = () => {
    if (score >= 80) return 'high';
    if (score >= 60) return 'medium';
    return 'low';
  };

  const getLabel = () => {
    if (score >= 80) return 'High confidence';
    if (score >= 60) return 'Moderate confidence';
    return 'Low confidence';
  };

  return (
    <div className="confidence-section">
      <div className={`confidence-circle ${getLevel()}`}>{score}%</div>
      <div className="confidence-details">
        <div className="confidence-label">{getLabel()}</div>
        <div className="confidence-info">
          Based on {reviewCount} review{reviewCount !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

export default ConfidenceScore;
