export type HealthStatus = 'ok' | 'degraded';
export function nonEmpty(value: string): string | undefined { const trimmed = value.trim(); return trimmed.length > 0 ? trimmed : undefined; }
