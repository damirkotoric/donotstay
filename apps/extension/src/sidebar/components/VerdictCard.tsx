import React from 'react';
import type { Verdict } from '@donotstay/shared';

interface VerdictCardProps {
  verdict: Verdict;
  oneLiner: string;
}

function VerdictCard({ verdict, oneLiner }: VerdictCardProps) {
  const getClassName = () => {
    switch (verdict) {
      case 'Stay':
        return 'stay';
      case 'Questionable':
        return 'depends';
      case 'Do Not Stay':
        return 'do_not_stay';
      default:
        return 'depends';
    }
  };

  return (
    <div className={`verdict-card ${getClassName()}`}>
      <div className="verdict-text">{verdict}</div>
      <div className="one-liner">{oneLiner}</div>
    </div>
  );
}

export default VerdictCard;
