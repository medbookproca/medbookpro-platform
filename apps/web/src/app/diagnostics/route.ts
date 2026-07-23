import { NextResponse } from 'next/server';
import { getReleaseMetadata } from '@/lib/release-metadata';
import { getOrCreateRequestId } from '@/lib/request-correlation';

export function GET(request: Request) {
  return NextResponse.json({
    service: 'medbookpro-web',
    status: 'ok',
    requestId: getOrCreateRequestId(request.headers.get('x-request-id')),
    environment: process.env.NODE_ENV,
    release: getReleaseMetadata(),
    timestamp: new Date().toISOString(),
  });
}
