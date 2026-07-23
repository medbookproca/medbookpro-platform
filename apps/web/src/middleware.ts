import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { getOrCreateRequestId } from '@/lib/request-correlation';

export async function middleware(request: NextRequest) {
  const startedAt = performance.now();
  const response = await updateSession(request);
  response.headers.set(
    'x-request-id',
    getOrCreateRequestId(request.headers.get('x-request-id')),
  );
  response.headers.set(
    'server-timing',
    `app;dur=${Math.max(0, performance.now() - startedAt).toFixed(2)}`,
  );
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|map)$).*)',
  ],
};
