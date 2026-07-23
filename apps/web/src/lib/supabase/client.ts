'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@medbookpro/database';
import { getSupabaseEnv } from './env';

let browserClient: SupabaseClient<Database> | undefined;

export function createClient(): SupabaseClient<Database> {
  if (browserClient) {
    return browserClient;
  }

  const { url, publishableKey } = getSupabaseEnv();
  browserClient = createBrowserClient<Database, 'public'>(url, publishableKey);
  return browserClient;
}
