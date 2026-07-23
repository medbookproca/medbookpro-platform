type DiagnosticValue = string | number | boolean | null;
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
