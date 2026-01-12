import React from 'react';
import type { RedFlag } from '@donotstay/shared';

interface RedFlagsProps {
  flags: RedFlag[];
}

function RedFlags({ flags }: RedFlagsProps) {
  return (
    <section className="red-flags">
      <h3>Red Flags</h3>
      {flags.map((flag, index) => (
        <div key={index} className="red-flag-item">
          <div className="red-flag-header">
            <span className="red-flag-issue">{flag.issue}</span>
            <span className={`red-flag-severity ${flag.severity}`}>
              {flag.severity}
            </span>
          </div>
          <div className="red-flag-mentions">
            Mentioned {flag.mention_count} time{flag.mention_count !== 1 ? 's' : ''}
          </div>
          {flag.evidence.length > 0 && (
            <div className="red-flag-evidence">
              "{flag.evidence[0]}"
            </div>
          )}
        </div>
      ))}
    </section>
  );
}

export default RedFlags;
