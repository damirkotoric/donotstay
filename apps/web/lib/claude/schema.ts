import { z } from 'zod';

export const RedFlagSchema = z.object({
  issue: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low']),
  mention_count: z.number(),
  evidence: z.array(z.string()),
});

export const VerdictResponseSchema = z.object({
  verdict: z.enum(['Stay', 'Questionable', 'Do Not Stay']),
  confidence: z.number().min(0).max(100),
  one_liner: z.string(),
  red_flags: z.array(RedFlagSchema),
  avoid_if_you_are: z.array(z.string()),
  bottom_line: z.string(),
});

export type VerdictResponse = z.infer<typeof VerdictResponseSchema>;
