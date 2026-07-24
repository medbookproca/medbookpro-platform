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
    if (details.message?.includes('DOCUMENT_CATEGORY_NOT_FOUND')) {
      return 'Choose an active document category and try again.';
    }
    if (details.message?.includes('DOCUMENT_ENCOUNTER_CONTEXT_INVALID')) {
      return 'The selected encounter does not belong to the selected patient.';
    }
    if (details.message?.includes('APPOINTMENT_TIMEZONE_INVALID')) {
      return 'Enter a supported timezone and try again.';
    }
    return 'Review the information and try again.';
  }
  if (details.message?.includes('APPOINTMENT_PATIENT_FORBIDDEN')) {
    return 'Select a patient from this organization.';
  }
  if (details.message?.includes('APPOINTMENT_PRACTITIONER_UNAVAILABLE')) {
    return 'The practitioner is not available at that time.';
  }
  if (details.message?.includes('APPOINTMENT_SERVICE_NOT_ASSIGNED')) {
    return 'The selected service is not assigned to this practitioner.';
  }
  if (details.message?.includes('APPOINTMENT_') && details.code === '23P01') {
    return 'That appointment conflicts with another booking.';
  }
  return fallback;
}
