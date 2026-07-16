import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
const publicEnv = z.object({ NEXT_PUBLIC_SUPABASE_URL: z.string().url(), NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1) });
export function createBrowserClient(): SupabaseClient { const env = publicEnv.parse(process.env); return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY); }
export function createServerClient(): SupabaseClient { const env = publicEnv.parse(process.env); return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY); }
