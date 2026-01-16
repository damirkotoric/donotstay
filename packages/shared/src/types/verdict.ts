export type Verdict = 'Stay' | 'Questionable' | 'Do Not Stay';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface RedFlag {
  issue: string;
  severity: Severity;
  mention_count: number;
  evidence: string[];
  last_reported: string;
  recency_note?: string; // e.g., "outdated - staff issue" or "possibly remediated"
}

export interface VerdictResult {
  verdict: Verdict;
  confidence: number;
  one_liner: string;
  red_flags: RedFlag[];
  avoid_if_you_are: string[];
  bottom_line: string;
  cached: boolean;
}
