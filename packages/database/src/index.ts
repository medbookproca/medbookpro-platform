import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from './database.types';

const publicEnv = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});
export type { Database, Json } from './database.types';

export function parsePublicSupabaseEnv(input: unknown = process.env) {
  return publicEnv.parse(input);
}

export function createBrowserClient(): SupabaseClient<Database> {
  const env = parsePublicSupabaseEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function createServerClient(): SupabaseClient<Database> {
  const env = parsePublicSupabaseEnv();
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
