import { NextResponse } from 'next/server';
import { getReleaseMetadata } from '@/lib/release-metadata';

export function GET() {
  return NextResponse.json({
    service: 'medbookpro-web',
    ...getReleaseMetadata(),
  });
}
