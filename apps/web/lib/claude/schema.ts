import { z } from 'zod';
import type { Verdict } from '@donotstay/shared';

const verdictValues = ['Stay', 'Questionable', 'Do Not Stay'] as const satisfies readonly Verdict[];

export const RedFlagSchema = z.object({
  issue: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  mention_count: z.number(),
  complaint_rate: z.number().nullish(), // Percentage: (mention_count / reviews_analyzed) * 100
  evidence: z.array(z.string()),
  last_reported: z.string(),
  recency_note: z.string().nullish(), // e.g., "Possibly outdated" or "Possibly remediated" - no time references (can be null or undefined)
});

export const VerdictResponseSchema = z.object({
  // LLM can adjust the code verdict: escalate OR downgrade for false positives
  verdict_escalation: z.enum(['Stay', 'Questionable', 'Do Not Stay']).optional(),
  escalation_reason: z.string().optional(),
  // Legacy field - kept for backwards compatibility with cached verdicts
  verdict: z.enum(verdictValues).optional(),
  verdict_override_reason: z.string().nullish(),
  confidence: z.number().min(0).max(100),
  one_liner: z.string(),
  red_flags: z.array(RedFlagSchema),
  avoid_if_you_are: z.array(z.string()),
  bottom_line: z.string(),
});

export type VerdictResponse = z.infer<typeof VerdictResponseSchema>;
