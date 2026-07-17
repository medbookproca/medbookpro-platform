export const DEFAULT_AUTH_REDIRECT = '/app';

export function getSafeNextPath(value: string | null | undefined, fallback = DEFAULT_AUTH_REDIRECT): string {
  if (!value || value.length > 2048 || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return fallback;
  }

  try {
    const parsed = new URL(value, 'https://medbookpro.invalid');
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function getAuthCallbackErrorPath(): string {
  return '/sign-in?error=auth_callback_failed';
}
