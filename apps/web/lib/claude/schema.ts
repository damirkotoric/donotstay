import { z } from 'zod';
import type { Verdict } from '@donotstay/shared';

const verdictValues = ['Stay', 'Questionable', 'Do Not Stay'] as const satisfies readonly Verdict[];

export const RedFlagSchema = z.object({
  issue: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  mention_count: z.number(),
  complaint_rate: z.number().nullish(),
  evidence: z.array(z.string()),
  last_reported: z.string(),
  recency_note: z.string().nullish(),
});

export const VerdictResponseSchema = z.object({
  verdict: z.enum(verdictValues),
  confidence: z.number().min(0).max(100),
  one_liner: z.string(),
  red_flags: z.array(RedFlagSchema),
  avoid_if_you_are: z.array(z.string()),
  bottom_line: z.string(),
});

export type VerdictResponse = z.infer<typeof VerdictResponseSchema>;
