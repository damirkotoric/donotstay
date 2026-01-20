import type { AnalyzeResponse } from '@donotstay/shared';

/**
 * Blur results for free tier users
 * Shows all items but marks how many should be visible (unblurred):
 * - Verdict (Stay/Questionable/Do Not Stay) - always visible
 * - Confidence score - always visible
 * - One-liner summary - always visible
 * - First red flag visible, rest blurred in UI
 * - First persona visible, rest blurred in UI
 * - Bottom-line: first line visible, rest blurred in UI
 */
export function blurResults(response: AnalyzeResponse): AnalyzeResponse {
  return {
    ...response,
    // Send all red flags, but only first one should be visible (unblurred)
    red_flags: response.red_flags,
    red_flags_visible_count: 1,
    // Send all personas, but only first one should be visible (unblurred)
    avoid_if_you_are: response.avoid_if_you_are,
    avoid_if_visible_count: 1,
    // Keep bottom_line - UI will blur after first line
    // Flag for UI
    is_blurred: true,
  };
}
