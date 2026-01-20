import type { RedFlag } from '@donotstay/shared';
import { Check, FlagBannerFold } from '@phosphor-icons/react';

interface RedFlagsProps {
  flags: RedFlag[];
  reviewCount: number;
  visibleCount?: number;
}

const MIN_REVIEWS_FOR_CONFIDENCE = 10;

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 1) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  if (diffDays < 730) return '1 year ago';
  return `${Math.floor(diffDays / 365)} years ago`;
}

function getSeverityStyles(severity: string) {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-destructive text-white';
    case 'high':
      return 'bg-verdict-donotstay text-white';
    case 'medium':
      return 'bg-verdict-depends text-foreground';
    case 'low':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function RedFlags({ flags, reviewCount, visibleCount }: RedFlagsProps) {
  // Filter out "Insufficient review data" flags - we handle this in the empty state
  const actualFlags = flags.filter(
    (f) => !f.issue.toLowerCase().includes('insufficient review')
  );

  // Determine how many flags should be visible (unblurred)
  const effectiveVisibleCount = visibleCount ?? actualFlags.length;

  // Sort by severity (critical first), then by recency (most recent first)
  const sortedFlags = [...actualFlags].sort((a, b) => {
    const severityDiff =
      (SEVERITY_ORDER[a.severity.toLowerCase()] ?? 4) -
      (SEVERITY_ORDER[b.severity.toLowerCase()] ?? 4);
    if (severityDiff !== 0) return severityDiff;

    const dateA = new Date(a.last_reported).getTime();
    const dateB = new Date(b.last_reported).getTime();
    return dateB - dateA; // Most recent first
  });

  const hasFlags = actualFlags.length > 0;
  const hasEnoughReviews = reviewCount >= MIN_REVIEWS_FOR_CONFIDENCE;

  // Empty state: too few reviews
  if (!hasFlags && !hasEnoughReviews) {
    return (
      <section className="bg-verdict-depends-light rounded-xl p-4">
        <h3 className="text-sm font-semibold text-verdict-depends mb-3 flex items-center gap-2">
          Red Flags
        </h3>
        <div className="text-center py-6 px-4">
          <div className="w-12 h-12 rounded-full bg-verdict-depends/20 text-verdict-depends flex items-center justify-center text-2xl font-bold mx-auto mb-3">
            ?
          </div>
          <div className="text-[15px] font-semibold text-foreground mb-1">Not enough data</div>
          <div className="text-[13px] text-muted-foreground">
            Only {reviewCount} review{reviewCount !== 1 ? 's' : ''} analyzed.
            We need more reviews to identify patterns.
          </div>
        </div>
      </section>
    );
  }

  // Empty state: many reviews but no issues found
  if (!hasFlags && hasEnoughReviews) {
    return (
      <section className="bg-verdict-stay-light rounded-xl p-4">
        <h3 className="text-sm font-semibold text-verdict-stay mb-3 flex items-center gap-2">
          Red Flags
        </h3>
        <div className="text-center py-6 px-4">
          <div className="w-12 h-12 rounded-full bg-verdict-stay/20 text-verdict-stay flex items-center justify-center mx-auto mb-3">
            <Check size={28} weight="bold" />
          </div>
          <div className="text-[15px] font-semibold text-foreground mb-1">No issues found</div>
          <div className="text-[13px] text-muted-foreground">
            Across {reviewCount} reviews, no recurring problems were identified.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="">
      <h3 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-1">
        <span className="text-lg">🚩</span> Red Flags
      </h3>
      <div className="border rounded-lg bg-border space-y-[1px] overflow-hidden">
        {sortedFlags.map((flag, index) => {
          const isCritical = flag.severity.toLowerCase() === 'critical';
          const isBlurred = index >= effectiveVisibleCount;
          const blurClass = isBlurred ? 'blur-[6px] select-none' : '';
          return (
            <div
              key={index}
              className="bg-background p-4 relative overflow-hidden"
            >
              {isCritical && (
                <FlagBannerFold
                  weight="bold"
                  className="absolute -bottom-4 -right-4 w-24 h-24 text-destructive/10 pointer-events-none"
                />
              )}
              <div className="flex items-start justify-between mb-1 relative z-10">
                <span className={`font-semibold text-foreground ${blurClass}`}>{flag.issue}</span>
                <span
                  className={`text-[11px] tracking-wider mt-0.5 px-2 py-0.5 rounded font-semibold uppercase ${getSeverityStyles(flag.severity)}`}
                >
                  {flag.severity}
                </span>
              </div>
              <div className={`text-xs text-muted-foreground mb-2 relative z-10 ${blurClass}`}>
                Mentioned {flag.mention_count} time{flag.mention_count !== 1 ? 's' : ''}, last {formatTimeAgo(flag.last_reported)}
              </div>
              {flag.evidence.length > 0 && (
                <div className={`text-sm text-muted-foreground italic relative z-10 ${blurClass}`}>
                  "{flag.evidence[0]}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default RedFlags;
