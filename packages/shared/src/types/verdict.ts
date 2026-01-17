export type Verdict = 'Stay' | 'Questionable' | 'Do Not Stay';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface RedFlag {
  issue: string;
  severity: Severity;
  mention_count: number;
  complaint_rate?: number | null; // Percentage: (mention_count / reviews_analyzed) * 100
  evidence: string[];
  last_reported: string;
  recency_note?: string | null; // e.g., "outdated - staff issue" or "possibly remediated"
}

export interface VerdictResult {
  verdict: Verdict;
  verdict_override_reason?: string | null; // Explanation if LLM overrode the suggested verdict
  confidence: number;
  one_liner: string;
  red_flags: RedFlag[];
  avoid_if_you_are: string[];
  bottom_line: string;
  cached: boolean;
}
