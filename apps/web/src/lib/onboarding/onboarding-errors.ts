export type OnboardingErrorCode = 'unauthenticated' | 'validation' | 'conflict' | 'unavailable' | 'forbidden' | 'unexpected';

export function mapOnboardingError(error: unknown): { code: OnboardingErrorCode; message: string } {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('ONBOARDING_UNAUTHENTICATED') || message.includes('ONBOARDING_PROFILE_INACTIVE')) return { code: 'unauthenticated', message: 'Your session is no longer available. Please sign in again.' };
  if (message.includes('ONBOARDING_INVALID_') || message.includes('ONBOARDING_REQUIRED_') || message.includes('ONBOARDING_PHYSICAL_')) return { code: 'validation', message: 'Review the highlighted information and try again.' };
  if (message.includes('duplicate') || message.includes('unique') || message.includes('ONBOARDING_OWNER_ROLE')) return { code: 'conflict', message: 'This onboarding request could not be completed. Please try again.' };
  if (message.includes('42501') || message.includes('permission')) return { code: 'forbidden', message: 'You are not allowed to complete this onboarding request.' };
  if (message.includes('fetch') || message.includes('network')) return { code: 'unavailable', message: 'The onboarding service is temporarily unavailable. Please try again.' };
  return { code: 'unexpected', message: 'We could not complete onboarding. Please try again.' };
}

