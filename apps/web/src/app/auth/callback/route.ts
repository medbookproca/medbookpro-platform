import { NextResponse, type NextRequest } from 'next/server';
import { getAuthCallbackErrorPath, getSafeNextPath } from '@/lib/auth/safe-redirect';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'));

  if (!code) {
    return NextResponse.redirect(new URL(getAuthCallbackErrorPath(), request.url));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(getAuthCallbackErrorPath(), request.url));
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
