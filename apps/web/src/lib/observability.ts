type DiagnosticValue = string | number | boolean | null | undefined;
type DiagnosticFields = Record<string, DiagnosticValue>;

function sanitize(fields: DiagnosticFields): DiagnosticFields {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      /token|secret|password|key|authorization|cookie|email|phone/i.test(key)
        ? '[REDACTED]'
        : value,
    ]),
  );
}

export function logDiagnostic(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: DiagnosticFields = {},
): void {
  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    fields: sanitize(fields),
  });
  if (level === 'error') console.error(entry);
  else if (level === 'warn') console.warn(entry);
  else console.info(entry);
}

export function getSafeErrorDetails(error: unknown): {
  code?: string;
  status?: number;
  message?: string;
  constraint?: string;
} {
  const record =
    error && typeof error === 'object'
      ? (error as Record<string, unknown>)
      : {};
  const code = typeof record.code === 'string' ? record.code : undefined;
  const status = typeof record.status === 'number' ? record.status : undefined;
  const rawMessage = error instanceof Error ? error.message : undefined;
  const message = rawMessage
    ?.replace(/bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/(?:sb_(?:publishable|secret)|eyJ)[A-Za-z0-9_.-]+/g, '[REDACTED]')
    .slice(0, 240);
  const constraint =
    typeof record.constraint === 'string' ? record.constraint : undefined;
  return { code, status, message, constraint };
}
