import { NextResponse } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/env';

export function GET() {
  try {
    getSupabaseEnv();
    return NextResponse.json({
      service: 'medbookpro-web',
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        service: 'medbookpro-web',
        status: 'not_ready',
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
