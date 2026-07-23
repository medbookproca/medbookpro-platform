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
export * from './billing-schemas';
export * from './reporting-schemas';
export * from './patient-portal-schemas';
export * from './document-schemas';
export * from './telehealth-schemas';
export * from './integration-schemas';
export * from './ai-schemas';
export * from './service-schemas';
