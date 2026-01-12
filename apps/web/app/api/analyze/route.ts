import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anthropic, MODEL, SYSTEM_PROMPT, buildUserPrompt, VerdictResponseSchema } from '@/lib/claude';
import { getCachedVerdict, cacheVerdict } from '@/lib/cache';
import { checkRateLimit, recordCheck } from '@/lib/rate-limit';
import type { AnalyzeRequest, AnalyzeResponse, ApiError } from '@donotstay/shared';

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { hotel, reviews } = body;

    if (!hotel || !reviews || reviews.length === 0) {
      return NextResponse.json<ApiError>(
        { error: 'Missing hotel info or reviews', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // Check for cached verdict
    const cached = await getCachedVerdict(hotel.url);
    if (cached) {
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
      return NextResponse.json(response);
    }

    // Get user from auth header
    const authHeader = request.headers.get('Authorization');
    let userId: string | null = null;
    let subscriptionStatus: 'free' | 'monthly' | 'annual' = 'free';

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabaseAdmin().auth.getUser(token);

      if (user) {
        userId = user.id;

        // Get subscription status
        const { data: userData } = await supabaseAdmin()
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
        { status: 429 }
      );
    }

    // Call Claude API
    const userPrompt = buildUserPrompt(hotel, reviews);

    const message = await anthropic().messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: userPrompt }
      ],
    });

    // Parse response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response (Claude might include markdown code blocks)
    let jsonText = content.text;
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonText = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonText.trim());
    const verdict = VerdictResponseSchema.parse(parsed);

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

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error analyzing hotel:', error);
    return NextResponse.json<ApiError>(
      { error: 'Failed to analyze hotel', code: 'ANALYSIS_ERROR' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
