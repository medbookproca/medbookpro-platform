import { NextResponse } from 'next/server';
export function GET() { return NextResponse.json({ service: 'medbookpro-web', status: 'ok', environment: process.env.NODE_ENV, timestamp: new Date().toISOString() }); }
