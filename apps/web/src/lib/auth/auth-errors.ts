export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'weak_password'
  | 'rate_limited'
  | 'invalid_email'
  | 'network_error'
  | 'service_unavailable'
  | 'unexpected';

export interface AuthErrorInfo {
  code: AuthErrorCode;
  message: string;
}

const messages: Record<AuthErrorCode, string> = {
  invalid_credentials: 'The email or password is incorrect.',
  email_not_confirmed: 'Please verify your email address before signing in.',
  weak_password: 'Choose a stronger password that meets all password requirements.',
  rate_limited: 'Too many requests. Please wait a moment and try again.',
  invalid_email: 'Enter a valid email address and try again.',
  network_error: 'The authentication service could not be reached. Check your connection and try again.',
  service_unavailable: 'Authentication is temporarily unavailable. Please try again later.',
  unexpected: 'We could not complete that request. Please try again.',
};

function getErrorRecord(error: unknown): Record<string, unknown> {
  return error && typeof error === 'object' ? error as Record<string, unknown> : {};
}

export function mapAuthError(error: unknown): AuthErrorInfo {
  const record = getErrorRecord(error);
  const code = typeof record.code === 'string' ? record.code : '';
  const status = typeof record.status === 'number' ? record.status : 0;

  if (code === 'invalid_credentials' || code === 'invalid_grant') {
    return { code: 'invalid_credentials', message: messages.invalid_credentials };
  }
  if (code === 'email_not_confirmed') {
    return { code, message: messages.email_not_confirmed };
  }
  if (code === 'weak_password' || code === 'password_too_short') {
    return { code: 'weak_password', message: messages.weak_password };
  }
  if (code.includes('rate_limit') || code.includes('too_many') || status === 429) {
    return { code: 'rate_limited', message: messages.rate_limited };
  }
  if (code === 'invalid_email' || code === 'validation_failed') {
    return { code: 'invalid_email', message: messages.invalid_email };
  }
  if (code === 'fetch_error' || code === 'network_error' || error instanceof TypeError) {
    return { code: 'network_error', message: messages.network_error };
  }
  if (status >= 500) {
    return { code: 'service_unavailable', message: messages.service_unavailable };
  }

  return { code: 'unexpected', message: messages.unexpected };
}

export function getAuthErrorMessage(error: unknown): string {
  return error instanceof AuthServiceError ? error.message : mapAuthError(error).message;
}

export class AuthServiceError extends Error {
  readonly code: AuthErrorCode;

  constructor(info: AuthErrorInfo) {
    super(info.message);
    this.name = 'AuthServiceError';
    this.code = info.code;
  }
}
