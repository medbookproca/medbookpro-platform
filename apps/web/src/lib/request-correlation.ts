const requestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/;

export function getOrCreateRequestId(value?: string | null): string {
  return value && requestIdPattern.test(value) ? value : crypto.randomUUID();
}
