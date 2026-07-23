'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  onboardingRequestSchema,
  type OnboardingRequest,
} from '@medbookpro/shared';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/supabase/auth-helpers';
import { mapOnboardingError } from '@/lib/onboarding/onboarding-errors';
import { getSafeErrorDetails, logDiagnostic } from '@/lib/observability';

export type OnboardingActionState = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createOrganizationOnboarding(
  input: OnboardingRequest,
): Promise<OnboardingActionState> {
  const parsed = onboardingRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: 'Review the highlighted information and try again.',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const user = await getCurrentUser();
  if (!user)
    return {
      ok: false,
      message: 'Your session is no longer available. Please sign in again.',
    };

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc(
      'create_organization_with_first_location',
      {
        p_idempotency_key: parsed.data.idempotencyKey,
        p_organization: parsed.data.organization,
        p_location: parsed.data.location,
      },
    );

    if (error) throw error;
  } catch (error) {
    const details = getSafeErrorDetails(error);
    logDiagnostic('error', 'onboarding.failed', {
      ...(process.env.NODE_ENV === 'development'
        ? details
        : { code: details.code, status: details.status }),
      environment: process.env.NODE_ENV,
    });
    const mapped = mapOnboardingError(error);
    return { ok: false, message: mapped.message };
  }

  revalidatePath('/app');
  redirect('/app');
}
