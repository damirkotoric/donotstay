import type { HotelInfo, ScrapedReview } from '@donotstay/shared';
import type { Severity } from '@donotstay/shared';

// Issue detection patterns grouped by severity
const ISSUE_PATTERNS: Record<string, { keywords: RegExp; severity: Severity; category: string }> = {
  // CRITICAL issues (safety, health, scams)
  mold: {
    keywords: /\b(mold|mould|mildew|fungus|musty smell|damp smell)\b/i,
    severity: 'critical',
    category: 'health',
  },
  bedbugs: {
    keywords: /\b(bed\s*bug|bedbug|bug\s*bite|insect\s*bite|flea|lice)\b/i,
    severity: 'critical',
    category: 'health',
  },
  rodents: {
    keywords: /\b(mouse|mice|rat|rodent|cockroach|roach|pest|infestation)\b/i,
    severity: 'critical',
    category: 'health',
  },
  scam: {
    keywords: /\b(scam|fraud|stolen|theft|hidden fee|hidden charge|overcharge|rip\s*off|ripoff)\b/i,
    severity: 'critical',
    category: 'safety',
  },
  unsafe: {
    keywords: /\b(unsafe|dangerous|sketchy|scary\s+neighborhood|crime|break[\s-]?in)\b/i,
    severity: 'critical',
    category: 'safety',
  },

  // HIGH severity issues
  noise: {
    keywords: /\b(noise|noisy|loud|thin\s*wall|hear\s*(neighbor|everything|next\s*room)|street\s*noise|traffic\s*noise|club|bar\s*noise|party|couldn'?t\s*sleep|woke\s*(me|us)\s*up)\b/i,
    severity: 'high',
    category: 'sleep',
  },
  ac_heating: {
    keywords: /\b(ac\s*(broken|not\s*work|didn'?t\s*work)|air\s*condition|heating\s*(broken|not\s*work)|too\s*(hot|cold)|freezing|sweltering|no\s*(ac|air\s*condition|heating))\b/i,
    severity: 'high',
    category: 'infrastructure',
  },
  hot_water: {
    keywords: /\b(no\s*hot\s*water|cold\s*water\s*only|hot\s*water\s*(issue|problem|not\s*work)|water\s*pressure)\b/i,
    severity: 'high',
    category: 'infrastructure',
  },
  cleanliness: {
    keywords: /\b(dirty|filthy|unclean|stain|hair\s*(on|in)|not\s*clean|disgusting|gross|hygiene)\b/i,
    severity: 'high',
    category: 'cleanliness',
  },
  bed_quality: {
    keywords: /\b(uncomfortable\s*bed|hard\s*mattress|soft\s*mattress|broken\s*bed|sagging|lumpy\s*bed|bad\s*bed)\b/i,
    severity: 'high',
    category: 'sleep',
  },

  // MEDIUM severity issues
  wifi: {
    keywords: /\b(wifi|wi-fi|internet)\s*(slow|bad|terrible|not\s*work|didn'?t\s*work|unreliable|spotty)\b/i,
    severity: 'medium',
    category: 'infrastructure',
  },
  staff_rude: {
    keywords: /\b(rude\s*(staff|reception|employee)|staff\s*(rude|unhelpful|unfriendly)|bad\s*service|terrible\s*service|impolite)\b/i,
    severity: 'medium',
    category: 'service',
  },
  misleading: {
    keywords: /\b(photo\s*(don'?t|doesn'?t|didn'?t)\s*match|misleading|false\s*advertis|not\s*as\s*(shown|pictured|advertised)|smaller\s*than\s*(expected|photo))\b/i,
    severity: 'medium',
    category: 'accuracy',
  },
  breakfast: {
    keywords: /\b(breakfast\s*(bad|terrible|poor|disappointing)|bad\s*breakfast|poor\s*breakfast)\b/i,
    severity: 'medium',
    category: 'service',
  },

  // LOW severity issues
  parking: {
    keywords: /\b(parking\s*(issue|problem|difficult|expensive)|no\s*parking|hard\s*to\s*park)\b/i,
    severity: 'low',
    category: 'amenities',
  },
  gym: {
    keywords: /\b(gym\s*(small|closed|broken|bad|poor)|no\s*gym|fitness\s*center\s*(closed|small))\b/i,
    severity: 'low',
    category: 'amenities',
  },
  elevator: {
    keywords: /\b(elevator\s*(slow|broken|out\s*of\s*order)|no\s*elevator|lift\s*(broken|slow))\b/i,
    severity: 'low',
    category: 'amenities',
  },
};

export type ComplaintClassification = 'significant_pattern' | 'notable' | 'isolated' | 'noise';

export interface DetectedIssue {
  issue: string;
  severity: Severity;
  category: string;
  mentionCount: number;
  complaintRate: number;
  classification: ComplaintClassification;
  reviewIndices: number[]; // Which reviews mentioned this issue
}

export interface PreComputedAnalysis {
  platformRating: number;
  ratingTier: 'excellent' | 'good' | 'moderate' | 'poor';
  reviewsAnalyzed: number;
  totalReviewsOnPlatform: number;
  detectedIssues: DetectedIssue[];
  hasCriticalFlags: boolean;
  highSeverityComplaintRate: number; // Max complaint rate among HIGH severity issues
  suggestedVerdict: 'Stay' | 'Questionable' | 'Do Not Stay';
  verdictReasoning: string;
}

function classifyComplaintRate(severity: Severity, rate: number): ComplaintClassification {
  switch (severity) {
    case 'critical':
      // Any instance of critical issues is concerning
      return rate > 0 ? 'significant_pattern' : 'noise';
    case 'high':
      if (rate > 5) return 'significant_pattern';
      if (rate >= 2) return 'notable';
      return 'isolated';
    case 'medium':
      if (rate > 10) return 'significant_pattern';
      if (rate >= 5) return 'notable';
      return 'isolated';
    case 'low':
      if (rate > 15) return 'significant_pattern';
      return 'noise';
  }
}

function getRatingTier(rating: number): 'excellent' | 'good' | 'moderate' | 'poor' {
  if (rating >= 9.0) return 'excellent';
  if (rating >= 8.0) return 'good';
  if (rating >= 7.0) return 'moderate';
  return 'poor';
}

function suggestVerdict(
  rating: number,
  hasCriticalFlags: boolean,
  detectedIssues: DetectedIssue[]
): { verdict: 'Stay' | 'Questionable' | 'Do Not Stay'; reasoning: string } {
  // Get max complaint rate for HIGH severity issues
  const highSeverityIssues = detectedIssues.filter((i) => i.severity === 'high');
  const maxHighRate = Math.max(0, ...highSeverityIssues.map((i) => i.complaintRate));

  // Count significant patterns
  const significantPatterns = detectedIssues.filter(
    (i) => i.classification === 'significant_pattern'
  ).length;
  const notableIssues = detectedIssues.filter((i) => i.classification === 'notable').length;

  // Critical flags always warrant concern
  if (hasCriticalFlags) {
    return {
      verdict: 'Do Not Stay',
      reasoning: 'Critical health/safety flags detected (mold, pests, scams, or safety concerns)',
    };
  }

  // Rating 9.0+: Stay unless high complaint rates
  if (rating >= 9.0) {
    if (maxHighRate > 5) {
      return {
        verdict: 'Questionable',
        reasoning: `High rating (${rating}) but significant complaint rate (${maxHighRate.toFixed(1)}%) on high-severity issues`,
      };
    }
    if (maxHighRate >= 3) {
      return {
        verdict: 'Stay',
        reasoning: `Excellent rating (${rating}) with some notable concerns (${maxHighRate.toFixed(1)}% complaint rate on high-severity issues)—note issues but recommend`,
      };
    }
    return {
      verdict: 'Stay',
      reasoning: `Excellent rating (${rating}) with low complaint rates—minor issues are statistical noise`,
    };
  }

  // Rating 8.0-8.9: Stay if complaint rates low
  if (rating >= 8.0) {
    if (maxHighRate > 5 || significantPatterns >= 2) {
      return {
        verdict: 'Questionable',
        reasoning: `Good rating (${rating}) but multiple issue patterns detected`,
      };
    }
    if (maxHighRate > 3) {
      return {
        verdict: 'Questionable',
        reasoning: `Good rating (${rating}) with notable complaint rate (${maxHighRate.toFixed(1)}%) on high-severity issues`,
      };
    }
    return {
      verdict: 'Stay',
      reasoning: `Good rating (${rating}) with acceptable complaint rates`,
    };
  }

  // Rating 7.0-7.9: Questionable baseline
  if (rating >= 7.0) {
    if (significantPatterns >= 2 || maxHighRate > 10) {
      return {
        verdict: 'Do Not Stay',
        reasoning: `Moderate rating (${rating}) with multiple significant patterns (${significantPatterns}) or high complaint rate (${maxHighRate.toFixed(1)}%)`,
      };
    }
    return {
      verdict: 'Questionable',
      reasoning: `Moderate rating (${rating})—requires scrutiny of specific issues`,
    };
  }

  // Rating <7.0: Scrutinize heavily
  if (significantPatterns >= 1 || notableIssues >= 2) {
    return {
      verdict: 'Do Not Stay',
      reasoning: `Low rating (${rating}) with confirmed issue patterns`,
    };
  }
  return {
    verdict: 'Questionable',
    reasoning: `Low rating (${rating})—limited data but concerning baseline`,
  };
}

export function analyzeReviews(hotel: HotelInfo, reviews: ScrapedReview[]): PreComputedAnalysis {
  const totalReviews = reviews.length;
  const detectedIssues: DetectedIssue[] = [];

  // Scan reviews for each issue pattern
  for (const [issueKey, pattern] of Object.entries(ISSUE_PATTERNS)) {
    const matchingReviews: number[] = [];

    reviews.forEach((review, index) => {
      const textToSearch = [review.cons, review.text, review.title].filter(Boolean).join(' ');

      if (pattern.keywords.test(textToSearch)) {
        matchingReviews.push(index);
      }
    });

    if (matchingReviews.length > 0) {
      const complaintRate = (matchingReviews.length / totalReviews) * 100;
      const classification = classifyComplaintRate(pattern.severity, complaintRate);

      detectedIssues.push({
        issue: issueKey.replace(/_/g, ' '),
        severity: pattern.severity,
        category: pattern.category,
        mentionCount: matchingReviews.length,
        complaintRate,
        classification,
        reviewIndices: matchingReviews,
      });
    }
  }

  // Sort by severity (critical first) then by complaint rate
  const severityOrder: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  detectedIssues.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.complaintRate - a.complaintRate;
  });

  const hasCriticalFlags = detectedIssues.some(
    (i) => i.severity === 'critical' && i.mentionCount > 0
  );
  const highSeverityIssues = detectedIssues.filter((i) => i.severity === 'high');
  const highSeverityComplaintRate = Math.max(0, ...highSeverityIssues.map((i) => i.complaintRate));

  const { verdict, reasoning } = suggestVerdict(hotel.rating, hasCriticalFlags, detectedIssues);

  return {
    platformRating: hotel.rating,
    ratingTier: getRatingTier(hotel.rating),
    reviewsAnalyzed: totalReviews,
    totalReviewsOnPlatform: hotel.review_count,
    detectedIssues,
    hasCriticalFlags,
    highSeverityComplaintRate,
    suggestedVerdict: verdict,
    verdictReasoning: reasoning,
  };
}

function formatPreComputedAnalysis(analysis: PreComputedAnalysis): string {
  const lines: string[] = [
    '## Pre-Computed Analysis',
    '',
    `Platform Rating: ${analysis.platformRating} (${analysis.ratingTier.toUpperCase()})`,
    `Reviews Analyzed: ${analysis.reviewsAnalyzed} of ${analysis.totalReviewsOnPlatform} total`,
    `Critical Flags Detected: ${analysis.hasCriticalFlags ? 'YES' : 'No'}`,
    `Max HIGH-Severity Complaint Rate: ${analysis.highSeverityComplaintRate.toFixed(1)}%`,
    '',
  ];

  if (analysis.detectedIssues.length > 0) {
    lines.push('### Detected Issues (keyword-based scan):');
    for (const issue of analysis.detectedIssues) {
      const classificationLabel = {
        significant_pattern: 'SIGNIFICANT PATTERN',
        notable: 'NOTABLE',
        isolated: 'ISOLATED',
        noise: 'NOISE',
      }[issue.classification];

      lines.push(
        `- ${issue.issue}: ${issue.mentionCount} mentions (${issue.complaintRate.toFixed(1)}% rate) → ${classificationLabel} [${issue.severity.toUpperCase()}]`
      );
    }
    lines.push('');
  } else {
    lines.push('### Detected Issues: None found via keyword scan');
    lines.push('');
  }

  lines.push(`## VERDICT (CODE BASELINE): ${analysis.suggestedVerdict}`);
  lines.push(`Reasoning: ${analysis.verdictReasoning}`);
  lines.push('');

  // Escalation/correction rules depend on rating tier
  const falsePositiveRule = `
FALSE POSITIVE CORRECTION: If the keyword scan triggered on a word out of context (e.g., "scam" used to describe room assignment, not fraud), you MAY downgrade the verdict to match reality. Set verdict_escalation to "Stay" or "Questionable" and explain the false positive in escalation_reason.`;

  if (analysis.ratingTier === 'excellent') {
    lines.push(
      `VERDICT ADJUSTMENT RULES FOR EXCELLENT HOTELS (${analysis.platformRating} rating):
- This hotel has EARNED trust through ${analysis.totalReviewsOnPlatform}+ reviews. Respect that.
- You may ONLY escalate to "Do Not Stay" for CRITICAL health/safety issues: mold, pests, bedbugs, safety hazards, actual scams
- Staff attitude, service complaints, or amenity issues can NEVER warrant "Do Not Stay" for a 9.0+ hotel
- You may escalate to "Questionable" for persistent HIGH severity issues (noise, cleanliness, infrastructure) if complaint rate >10%
- Isolated complaints are statistical noise at this rating level—note them but don't overweight
${falsePositiveRule}
- If you adjust the verdict, set "verdict_escalation" to the new verdict and explain in "escalation_reason"
- If you agree with the code verdict, omit both fields`
    );
  } else if (analysis.ratingTier === 'good') {
    lines.push(
      `VERDICT ADJUSTMENT RULES FOR GOOD HOTELS (${analysis.platformRating} rating):
- You may ESCALATE the verdict (Stay → Questionable, or Questionable → Do Not Stay) if you find strong justification
- Valid escalation reasons: CRITICAL issues (health/safety), high complaint rates (>10%) on HIGH severity issues
- Staff attitude alone cannot escalate to "Do Not Stay"—max is "Questionable"
${falsePositiveRule}
- If you adjust the verdict, set "verdict_escalation" to the new verdict and explain in "escalation_reason"
- If you agree with the code verdict, omit both fields`
    );
  } else {
    lines.push(
      `VERDICT ADJUSTMENT RULES:
- You may ESCALATE the verdict (Stay → Questionable, or Questionable → Do Not Stay) if you find strong justification the keyword scan missed
- Valid escalation reasons: recent cluster of CRITICAL issues (bugs, mold, safety), context keywords missed, compounding issues
${falsePositiveRule}
- If you adjust the verdict, set "verdict_escalation" to the new verdict and explain in "escalation_reason"
- If you agree with the code verdict, omit both fields`
    );
  }

  return lines.join('\n');
}

export const SYSTEM_PROMPT = `You are DoNotStay, an AI that helps travelers avoid regretful accommodation choices. You're blunt, opinionated, and user-aligned. You don't work for hotels. You work for the person trying to sleep.

Your voice: a well-traveled, literary friend who has opinions and will roast a hotel while still being fair. Not corporate. Not dry. But never confusing—wit serves clarity, never competes with it.

## Your Doctrine
- One CRITICAL deal-breaker (safety, health, scams) outweighs everything else
- Prioritize sleep, health, and safety above all else
- Assume marketing inflation—look for repeated failure patterns
- HIGH RATINGS EARN BENEFIT OF THE DOUBT: A 9.0+ rated hotel with 1000+ reviews has EARNED trust through thousands of satisfied guests. The sampling of reviews you see is biased toward negatives. Most guests loved it.
- Never state facts. State confidence based on evidence.
- Be calibrated. A 9.6 hotel with staff complaints is still a 9.6 hotel—96% of guests were satisfied. Note concerns, don't catastrophize them.

## Pre-Computed Analysis
The user prompt includes a "Pre-Computed Analysis" section with:
- Complaint rates already calculated for detected issues
- Classification of each issue (SIGNIFICANT PATTERN, NOTABLE, ISOLATED, NOISE)
- THE FINAL VERDICT (decided by code based on thresholds)

YOUR JOB:
- The code provides a BASELINE verdict based on complaint rate thresholds.
- You may ESCALATE (make worse) but NEVER DOWNGRADE (make better).
- Escalate only for strong reasons: recent CRITICAL issues the keywords missed, compounding patterns, safety concerns.
- Match your tone to the FINAL verdict (baseline or escalated).
- Use the complaint rates provided. Do NOT recalculate.

## Deal-Breakers (flag aggressively)
- Noise: street noise, thin walls, neighbors, early morning disturbances, clubs/bars nearby
- Sleep disruptors: uncomfortable beds, light pollution, temperature control issues
- Health: mold, damp, mildew, bugs, insects, rodents, cleanliness issues
- Safety: sketchy neighborhood, security concerns, scams, hidden fees
- Infrastructure: AC/heating failures, hot water issues, WiFi unreliability, power outages
- Accuracy: photos don't match reality, misleading descriptions

## Severity Assignment Rules
CRITICAL severity is RESERVED for health and safety issues ONLY:
- Mold, mildew, damp
- Bed bugs, insects, rodents, pests
- Safety hazards, dangerous conditions
- Scams, fraud, hidden predatory fees

NEVER assign CRITICAL to:
- Staff attitude, rudeness, or service quality (max: MEDIUM)
- Amenity issues like gym, pool, parking (max: LOW)
- WiFi, breakfast quality (max: MEDIUM)
- Noise, cleanliness (max: HIGH)

Match the pre-computed severities from the code. Don't inflate them.

## Recency Weighting
Not all old complaints age the same. Apply different weights based on issue type:

**Timeless issues (weight equally regardless of age):**
- Structural: thin walls, noise from street/neighbors, building location near clubs/bars
- Health hazards: mold, damp, mildew, pest infestations
- Fundamental infrastructure: plumbing issues, room size, natural light, ventilation

**Time-sensitive issues (discount if >18 months old):**
- Staff behavior, rudeness, unhelpfulness
- Service quality, breakfast quality, restaurant issues
- Management responsiveness
- Cleanliness (staff-dependent, not structural)
- WiFi speed (often upgraded)

**Possible remediation signals:**
- If a structural issue appears in old reviews but stops appearing in recent ones, note this as "possibly addressed" but remain skeptical—some issues are seasonal or intermittent
- Recent renovations mentioned in reviews can reset the clock on infrastructure issues

When an issue is time-sensitive and only appears in reviews >18 months old, reduce its severity by one level and note the age in evidence.

## Verdict Meanings (for tone guidance)
- "Stay": RECOMMENDED. This is a good hotel. Your writing should be positive and affirming. Note any minor concerns as footnotes, but lead with what makes it good. A 9.0+ hotel with minor staff complaints still gets "Stay"—celebrate what works.
- "Questionable": Proceed with caution—mixed signals or notable concerns. Your writing should be balanced. Worth considering but research your specific needs.
- "Do Not Stay": Avoid this hotel—serious health, safety, or systemic issues confirmed. Your writing should be critical. Reserve this for genuine deal-breakers, not imperfect service.

## One-Liner Rules
- Must answer: "What's the catch?" or "What makes it good?"
- Maximum 5 words
- For "Stay" verdicts: Lead with what's good. Can note minor caveat. Examples: "Great Location, Minor Staff Issues" / "Excellent, Some Noise" / "Highly Recommended"
- For "Questionable"/"Do Not Stay": Focus on the problem. Examples: "Noise After Midnight" / "Mold Problem" / "Serious Cleanliness Issues"
- Clarity first, wit second
- If it could be misread or needs explanation, rewrite it
- Bad: "Sophie Deserves a Raise" / "Amenities Sold Separately" / "The Asterisk Hotel"

## Issue Naming Rules
- Use plain language
- Say what's actually wrong
- Good: "Gym is broken" / "Street noise at night" / "Some bathrooms smell"
- Bad: "Gym is decorative" / "Bathrooms have opinions" / "Construction vibes"

## Confidence Calibration
- 90-100: Clear pattern across many reviews. High certainty.
- 70-89: Solid signal, some inconsistency.
- 50-69: Mixed signals. Depends on user priorities.
- Below 50: Insufficient data or conflicting evidence.

Review count adjustment:
- <50 reviews: Cap confidence at 70 unless issues are severe and consistent
- 50-200 reviews: Cap confidence at 85
- 200+ reviews: Full range available

## Tone Guidelines
- Sound like a smart friend, not a legal document
- Personality is fine. Confusion is not.
- You can be funny if the joke is instantly clear
- Never sacrifice meaning for cleverness
- Roast the hotel if it deserves it, but be fair`;

export interface BuildPromptResult {
  prompt: string;
  codeVerdict: 'Stay' | 'Questionable' | 'Do Not Stay';
  verdictReasoning: string;
}

export function buildUserPrompt(hotel: HotelInfo, reviews: ScrapedReview[]): BuildPromptResult {
  // Pre-compute complaint rates and verdict (code decides the verdict)
  const analysis = analyzeReviews(hotel, reviews);
  const preComputedSection = formatPreComputedAnalysis(analysis);

  const reviewsText = reviews
    .map((r, i) => {
      const parts = [`Review ${i + 1}:`];
      if (r.author) parts.push(`Author: ${r.author}`);
      if (r.country) parts.push(`Country: ${r.country}`);
      if (r.score) parts.push(`Score: ${r.score}`);
      if (r.date) parts.push(`Date: ${r.date}`);
      if (r.pros) parts.push(`Pros: ${r.pros}`);
      if (r.cons) parts.push(`Cons: ${r.cons}`);
      if (r.text && !r.pros && !r.cons) parts.push(`Review: ${r.text}`);
      return parts.join('\n');
    })
    .join('\n\n');

  const prompt = `${preComputedSection}

## Hotel Information
Hotel: ${hotel.hotel_name}
Location: ${hotel.location}

## Reviews
${reviewsText}

## Output (JSON only, no markdown code blocks)
IMPORTANT: Output raw JSON only. No \`\`\`json blocks. No explanation text. Just the JSON object.
Keep evidence arrays short (max 3 quotes per issue). Keep quotes concise (under 50 words each).
CRITICAL: ALL quotes in evidence arrays MUST be in English. Translate any non-English quotes to English.

Use the pre-computed complaint rates. For any ADDITIONAL issues you identify, calculate: (mentions / ${reviews.length} reviews) × 100.

{
  "verdict_escalation": "<ONLY if escalating: 'Questionable' or 'Do Not Stay'. Omit if accepting code verdict>",
  "escalation_reason": "<ONLY if escalating: 1 sentence explaining why. Omit otherwise>",
  "confidence": <0-100>,
  "one_liner": "<max 5 words - must match the FINAL verdict tone>",
  "red_flags": [
    {
      "issue": "<plain, clear issue name>",
      "severity": "critical" | "high" | "medium" | "low",
      "mention_count": <number>,
      "complaint_rate": <calculated percentage>,
      "evidence": ["<max 3 short quotes, ALL IN ENGLISH>"],
      "last_reported": "<YYYY-MM-DD>",
      "recency_note": "<short note like 'Possibly outdated' or 'Possibly remediated' - do NOT include time references since we display the date separately>"
    }
  ],
  "avoid_if_you_are": ["<persona>", "<persona>"],
  "bottom_line": "<2-3 sentences max - must match the verdict tone>"
}`;

  return {
    prompt,
    codeVerdict: analysis.suggestedVerdict,
    verdictReasoning: analysis.verdictReasoning,
  };
}
