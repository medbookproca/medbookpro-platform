import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from './database.types';

const publicEnv = z.object({ NEXT_PUBLIC_SUPABASE_URL: z.string().url(), NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1) });
export type { Database } from './database.types';

export function createBrowserClient(): SupabaseClient<Database> {
  const env = publicEnv.parse(process.env);
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createServerClient(): SupabaseClient<Database> {
  const env = publicEnv.parse(process.env);
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
