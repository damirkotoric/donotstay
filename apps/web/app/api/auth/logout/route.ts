import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('donotstay_session')?.value;

    // Sign out from Supabase if we have a token
    if (sessionToken) {
      const supabase = supabaseAdmin();
      if (supabase) {
        // Revoke the session
        await supabase.auth.admin.signOut(sessionToken);
      }
    }

    // Clear the session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.delete('donotstay_session');
    return response;
  } catch (error) {
    console.error('Error during logout:', error);
    // Still clear the cookie even if Supabase signout fails
    const response = NextResponse.json({ success: true });
    response.cookies.delete('donotstay_session');
    return response;
  }
}
