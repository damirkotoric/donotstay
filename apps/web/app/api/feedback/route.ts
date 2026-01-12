import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { FeedbackRequest, ApiError } from '@donotstay/shared';

export async function POST(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json<ApiError>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin().auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    const body: FeedbackRequest = await request.json();
    const { verdict_id, type, details } = body;

    if (!verdict_id || !type) {
      return NextResponse.json<ApiError>(
        { error: 'Missing required fields', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    if (!['inaccurate', 'helpful', 'other'].includes(type)) {
      return NextResponse.json<ApiError>(
        { error: 'Invalid feedback type', code: 'INVALID_TYPE' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin().from('feedback').insert({
      user_id: user.id,
      verdict_id,
      type,
      details: details || null,
    });

    if (error) {
      console.error('Error saving feedback:', error);
      return NextResponse.json<ApiError>(
        { error: 'Failed to save feedback', code: 'FEEDBACK_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing feedback:', error);
    return NextResponse.json<ApiError>(
      { error: 'Failed to process feedback', code: 'FEEDBACK_ERROR' },
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
