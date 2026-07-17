'use client';

import { createClient } from '@/lib/supabase/client';
import { createSupabaseAuthService } from './auth-service';

export function getSupabaseAuthService() {
  return createSupabaseAuthService(createClient());
}
