import { getSafeErrorDetails, logDiagnostic } from './observability';

export function getSafeActionError(
  error: unknown,
  event: string,
  fallback: string,
): string {
  const details = getSafeErrorDetails(error);
  logDiagnostic('error', event, {
    ...(process.env.NODE_ENV === 'development'
      ? details
      : { code: details.code, status: details.status }),
    environment: process.env.NODE_ENV,
  });

  if (details.code === '23505' || details.message?.includes('already exists')) {
    return 'This record already exists. Review the information and try again.';
  }
  if (details.code === '42501' || details.message?.includes('FORBIDDEN')) {
    return 'You are not allowed to complete this request.';
  }
  if (details.code === '22023') {
    return 'Review the information and try again.';
  }
  return fallback;
}
