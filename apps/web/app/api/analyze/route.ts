import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic, MODEL, SYSTEM_PROMPT, buildUserPrompt, VerdictResponseSchema } from '@/lib/claude';
import { getCachedVerdict, cacheVerdict } from '@/lib/cache';
import { checkRateLimit, recordCheck } from '@/lib/rate-limit';
import type { AnalyzeRequest, AnalyzeResponse, ApiError } from '@donotstay/shared';
import { ZodError } from 'zod';

/**
 * Attempt to repair common JSON issues from LLM output
 */
function repairJson(text: string): string {
  let repaired = text;

  // Fix unescaped newlines inside strings (common LLM issue)
  // This regex finds strings and escapes any literal newlines inside them
  repaired = repaired.replace(/"([^"\\]|\\.)*"/g, (match) => {
    return match.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
  });

  // Remove trailing commas before ] or }
  repaired = repaired.replace(/,(\s*[}\]])/g, '$1');

  // Fix missing commas between array elements (e.g., "string1" "string2" -> "string1", "string2")
  repaired = repaired.replace(/(")\s*\n\s*(")/g, '$1,\n$2');

  // Fix missing commas between objects in arrays
  repaired = repaired.replace(/}\s*\n\s*{/g, '},\n{');

  return repaired;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { hotel, reviews } = body;

    if (!hotel || !reviews || reviews.length === 0) {
      return NextResponse.json<ApiError>(
        { error: 'Missing hotel info or reviews', code: 'INVALID_REQUEST' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check for cached verdict
    const cached = await getCachedVerdict(hotel.url);
    if (cached && cached.verdict) {
      const response: AnalyzeResponse = {
        hotel_id: hotel.hotel_id,
        verdict: cached.verdict,
        confidence: cached.confidence,
        one_liner: cached.one_liner,
        red_flags: cached.red_flags,
        avoid_if_you_are: cached.avoid_if_you_are,
        bottom_line: cached.bottom_line,
        review_count_analyzed: cached.review_count,
        cached: true,
      };
      return NextResponse.json(response, { headers: corsHeaders });
    }

    // Get user from auth header
    const authHeader = request.headers.get('Authorization');
    let userId: string | null = null;
    let subscriptionStatus: 'free' | 'monthly' | 'annual' = 'free';

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const supabase = supabaseAdmin();
      if (!supabase) {
        return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
      }
      const { data: { user } } = await supabase.auth.getUser(token);

      if (user) {
        userId = user.id;

        // Get subscription status
        const { data: userData } = await supabase
          .from('users')
          .select('subscription_status')
          .eq('id', user.id)
          .single();

        if (userData) {
          subscriptionStatus = userData.subscription_status;
        }
      }
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(userId, subscriptionStatus);
    if (!rateLimit.allowed) {
      return NextResponse.json<ApiError>(
        {
          error: 'Rate limit exceeded',
          code: 'RATE_LIMITED',
          rate_limit: {
            remaining: rateLimit.remaining,
            reset_at: rateLimit.reset_at,
            is_paid: subscriptionStatus !== 'free',
          },
        },
        { status: 429, headers: corsHeaders }
      );
    }

    // Call Claude API
    const userPrompt = buildUserPrompt(hotel, reviews);

    const message = await anthropic().messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    // Check if response was truncated
    console.log('Claude stop_reason:', message.stop_reason);
    console.log('Claude usage:', message.usage);
    if (message.stop_reason === 'max_tokens') {
      throw new Error('Claude response was truncated - response too long');
    }

    // Parse response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Log the FULL raw response for debugging
    console.log('=== FULL CLAUDE RESPONSE START ===');
    console.log(content.text);
    console.log('=== FULL CLAUDE RESPONSE END ===');
    console.log('Response length:', content.text.length);

    // Extract JSON from response (Claude might include markdown code blocks or extra text)
    let jsonText = content.text;

    // First, try to extract from markdown code blocks (use greedy match for the content)
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      console.log('Found markdown code block, extracting...');
      jsonText = jsonMatch[1];
    } else {
      // No code blocks - try to find JSON object by looking for first { and last }
      console.log('No markdown code block found, looking for raw JSON...');
      const firstBrace = jsonText.indexOf('{');
      const lastBrace = jsonText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonText = jsonText.slice(firstBrace, lastBrace + 1);
      }
    }

    console.log('Extracted JSON length:', jsonText.length);

    let parsed;
    try {
      parsed = JSON.parse(jsonText.trim());
    } catch (parseError) {
      // Try to repair common JSON issues and parse again
      console.log('Initial JSON parse failed, attempting repair...');
      const repairedJson = repairJson(jsonText.trim());
      try {
        parsed = JSON.parse(repairedJson);
        console.log('JSON repair successful');
      } catch (repairError) {
        console.error('JSON parse error after repair:', repairError);
        console.error('Original text:', jsonText.substring(0, 1000));
        console.error('Repaired text:', repairedJson.substring(0, 1000));
        throw new Error(`JSON parse failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
      }
    }

    // Log the parsed response for debugging
    console.log('Claude response parsed:', JSON.stringify(parsed, null, 2));

    const validationResult = VerdictResponseSchema.safeParse(parsed);
    if (!validationResult.success) {
      console.error('Zod validation errors:', JSON.stringify(validationResult.error.issues, null, 2));
      console.error('Raw Claude response:', content.text.substring(0, 1000));
      throw validationResult.error;
    }
    const verdict = validationResult.data;

    // Cache the verdict
    await cacheVerdict(hotel.url, verdict, reviews.length);

    // Record the check for rate limiting
    if (userId) {
      await recordCheck(userId, hotel.hotel_id);
    }

    const response: AnalyzeResponse = {
      hotel_id: hotel.hotel_id,
      verdict: verdict.verdict,
      confidence: verdict.confidence,
      one_liner: verdict.one_liner,
      red_flags: verdict.red_flags,
      avoid_if_you_are: verdict.avoid_if_you_are,
      bottom_line: verdict.bottom_line,
      review_count_analyzed: reviews.length,
      cached: false,
    };

    return NextResponse.json(response, { headers: corsHeaders });
  } catch (error) {
    console.error('Error analyzing hotel:', error);

    // Provide more specific error messages for debugging
    let errorMessage = 'Failed to analyze hotel';
    let errorCode: ApiError['code'] = 'ANALYSIS_ERROR';

    if (error instanceof ZodError) {
      const fieldErrors = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      errorMessage = `Schema validation failed: ${fieldErrors}`;
      console.error('Zod validation failed:', fieldErrors);
    } else if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Claude API configuration error';
      } else if (error.message.includes('rate') || error.message.includes('429')) {
        errorMessage = 'Claude API rate limited';
      } else if (error.message.includes('JSON parse failed')) {
        // Include the actual parse error for debugging
        errorMessage = error.message;
      } else if (error.message.includes('JSON') || error.message.includes('parse')) {
        errorMessage = 'Failed to parse Claude response';
      } else {
        errorMessage = `Analysis error: ${error.message}`;
      }
      // Log the actual error for server-side debugging
      console.error('Detailed error:', error.message, error.stack);
    }

    return NextResponse.json<ApiError>(
      { error: errorMessage, code: errorCode },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}
