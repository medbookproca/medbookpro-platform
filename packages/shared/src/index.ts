export type HealthStatus = 'ok' | 'degraded';
export function nonEmpty(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export * from './auth-schemas';
export * from './onboarding-schemas';
export * from './staff-schemas';
export * from './practitioner-schemas';
export * from './availability-schemas';
export * from './appointment-schemas';
export * from './clinical-schemas';
export * from './patient-schemas';
export * from './communications-schemas';
