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
    keywords: /\b(mouse|mice|rat|rats|rodent|cockroach|roaches|roach|pest\s*infestation|infestation)\b/i,
    severity: 'critical',
    category: 'health',
  },
  insects: {
    keywords: /\b(ant|ants|spider|spiders|insect|insects|bug|bugs|crawl|crawling|critter|critters|earthworm|worm)\b/i,
    severity: 'high',
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

  return {
    platformRating: hotel.rating,
    ratingTier: getRatingTier(hotel.rating),
    reviewsAnalyzed: totalReviews,
    totalReviewsOnPlatform: hotel.review_count,
    detectedIssues,
  };
}

function formatPreComputedAnalysis(analysis: PreComputedAnalysis): string {
  const lines: string[] = [
    '## Context',
    '',
    `Platform Rating: ${analysis.platformRating}/10 (${analysis.ratingTier.toUpperCase()})`,
    `Reviews Analyzed: ${analysis.reviewsAnalyzed} of ${analysis.totalReviewsOnPlatform} total`,
    '',
  ];

  if (analysis.detectedIssues.length > 0) {
    lines.push('### Keyword Scan Results (for reference, not definitive):');
    for (const issue of analysis.detectedIssues) {
      lines.push(
        `- "${issue.issue}": ${issue.mentionCount} mentions (${issue.complaintRate.toFixed(1)}% of reviews)`
      );
    }
    lines.push('');
    lines.push('Note: This keyword scan may include false positives or miss issues. Use your judgment based on actual review content.');
  } else {
    lines.push('### Keyword Scan: No common issues detected');
    lines.push('Note: This does not mean there are no issues—read the reviews carefully.');
  }

  return lines.join('\n');
}

export const SYSTEM_PROMPT = `You are DoNotStay, an AI that helps travelers avoid regretful accommodation choices. You're blunt, opinionated, and user-aligned. You don't work for hotels. You work for the person trying to sleep.

Your voice: a well-traveled, literary friend who has opinions and will roast a hotel while still being fair. Not corporate. Not dry. But never confusing—wit serves clarity, never competes with it.

## Your Job
Read the reviews. Decide the verdict. You own this decision entirely.

## Verdict Options
- **"Stay"**: Recommended. This is a good hotel.
- **"Questionable"**: Mixed signals or notable concerns. Worth considering but research your specific needs.
- **"Do Not Stay"**: Avoid. Serious health, safety, or systemic issues confirmed.

## Decision Framework

**FIRST: Check for automatic "Do Not Stay" triggers (these override EVERYTHING):**
- Nightclub/bar noise until late (even 2+ mentions) = "Do Not Stay" — structural, affects everyone, won't change
- **2+ pest mentions (rats, cockroaches, bedbugs) in the last 6 months = "Do Not Stay"** — this is non-negotiable. Multiple recent sightings mean an active, systemic problem.
- Mold, safety hazards, confirmed scams = "Do Not Stay"
- Multiple complaints about dirty sheets, hair in beds, bathroom grime = "Do Not Stay"

If ANY of the above are present, verdict MUST be "Do Not Stay". No exceptions. Do NOT hedge with "Questionable". Rating doesn't matter. A 9.5-rated hotel with cockroaches is still "Do Not Stay".

**THEN: For hotels without deal-breakers:**

High ratings (9.0+) earn benefit of the doubt for lesser issues like staff attitude, WiFi, or breakfast complaints.

**Context for ambiguous issues:**
- Ants in a tropical villa where guest left food out = expected, note but don't penalize
- Spiders in a rural B&B = nature, not negligence
- One-off complaint 2+ years ago = possibly resolved
- Urban hotel with recurring insect problems = sanitation issue

**Recency:**
- Structural issues (thin walls, location noise) = timeless, weight equally
- Staff/service complaints = discount if >18 months old

## Severity Rules
CRITICAL = health/safety: mold, pests (rats/roaches/bedbugs), safety hazards, scams
HIGH = bed/bathroom hygiene (dirty sheets, hair, crumbs, grimy bathrooms), noise, infrastructure failures
MEDIUM = general untidiness, staff attitude, WiFi, breakfast, misleading photos
LOW = amenity issues (gym, parking, elevator)

Note: "Cleanliness" spans HIGH to MEDIUM. Dirty sheets, bathroom grime, previous guests' residue = HIGH. Dusty surfaces, minor mess = MEDIUM.

## One-Liner Rules
- Maximum 5 words
- Answer: "What's the catch?" or "What makes it good?"
- For "Stay": Lead with what's good. "Great Location, Minor Staff Issues"
- For problems: Focus on the issue. "Noise After Midnight" / "Recurring Pest Problem"
- Clarity first, wit second

## Confidence Calibration
- 90-100: Clear pattern across many reviews
- 70-89: Solid signal, some inconsistency
- 50-69: Mixed signals, depends on priorities
- Below 50: Insufficient data

Adjust for review count:
- <50 reviews: Cap at 70 unless issues are severe
- 50-200 reviews: Cap at 85
- 200+ reviews: Full range

## Tone
Match your tone to your verdict:
- "Stay": Positive, affirming. Celebrate what works, note concerns as footnotes.
- "Questionable": Balanced. Present both sides.
- "Do Not Stay": Critical. Be direct about problems.

Sound like a smart friend, not a legal document. Roast if deserved, but be fair.`;

/**
 * Enforces hard "Do Not Stay" rules that Claude might miss.
 * This is a safety net - if certain conditions are met, we override the verdict.
 */
export function enforceVerdictRules(
  verdict: { verdict: string; red_flags: Array<{ issue: string; severity: string; mention_count: number; last_reported: string }> }
): { verdict: string; wasOverridden: boolean; reason?: string } {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Check for pest issues (rats, cockroaches, bedbugs, roaches)
  const pestKeywords = /\b(pest|rat|rats|mouse|mice|rodent|cockroach|roach|bedbug|bed\s*bug)\b/i;

  const pestFlags = verdict.red_flags.filter(flag =>
    pestKeywords.test(flag.issue) && flag.severity === 'critical'
  );

  // Count recent pest mentions (within last 6 months)
  let recentPestMentions = 0;
  for (const flag of pestFlags) {
    if (flag.last_reported) {
      const reportDate = new Date(flag.last_reported);
      if (reportDate >= sixMonthsAgo) {
        recentPestMentions += flag.mention_count;
      }
    } else {
      // If no date, assume it's recent (conservative approach)
      recentPestMentions += flag.mention_count;
    }
  }

  // Rule: 2+ pest mentions in last 6 months = Do Not Stay
  if (recentPestMentions >= 2 && verdict.verdict !== 'Do Not Stay') {
    return {
      verdict: 'Do Not Stay',
      wasOverridden: true,
      reason: `Overridden: ${recentPestMentions} pest reports in last 6 months`
    };
  }

  return { verdict: verdict.verdict, wasOverridden: false };
}

export function buildUserPrompt(hotel: HotelInfo, reviews: ScrapedReview[]): string {
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

  return `${preComputedSection}

## Hotel Information
Hotel: ${hotel.hotel_name}
Location: ${hotel.location}

## Reviews
${reviewsText}

## Output (JSON only, no markdown code blocks)
Output raw JSON only. No \`\`\`json blocks. No explanation text. Just the JSON object.
Keep evidence arrays short (max 3 quotes per issue). Keep quotes concise (under 50 words each).
ALL quotes in evidence arrays MUST be in English. Translate any non-English quotes.

{
  "verdict": "Stay" | "Questionable" | "Do Not Stay",
  "confidence": <0-100>,
  "one_liner": "<max 5 words>",
  "red_flags": [
    {
      "issue": "<plain, clear issue name>",
      "severity": "critical" | "high" | "medium" | "low",
      "mention_count": <number>,
      "complaint_rate": <percentage of ${reviews.length} reviews>,
      "evidence": ["<max 3 short quotes, ALL IN ENGLISH>"],
      "last_reported": "<YYYY-MM-DD>",
      "recency_note": "<optional: 'Possibly outdated' or 'Possibly remediated'>"
    }
  ],
  "avoid_if_you_are": ["<persona>", "<persona>"],
  "bottom_line": "<2-3 sentences max>"
}`;
}
