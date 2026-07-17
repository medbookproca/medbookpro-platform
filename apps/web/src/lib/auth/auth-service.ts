import type { SupabaseClient } from '@supabase/supabase-js';
import { AuthServiceError, mapAuthError } from './auth-errors';

export interface SignInRequest {
  email: string;
  password: string;
  nextPath?: string;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  emailRedirectTo: string;
}

export interface AuthOperationResult {
  success: true;
  message: string;
}

export interface AuthService {
  signIn(request: SignInRequest): Promise<AuthOperationResult>;
  signUp(request: SignUpRequest): Promise<AuthOperationResult>;
  signOut(): Promise<void>;
}

type SupabaseAuthClient = Pick<SupabaseClient, 'auth'>;

export function createSupabaseAuthService(client: SupabaseAuthClient): AuthService {
  return {
    async signIn(request) {
      const { error } = await client.auth.signInWithPassword({
        email: request.email,
        password: request.password,
      });

      if (error) {
        throw new AuthServiceError(mapAuthError(error));
      }

      return { success: true, message: 'Sign in successful.' };
    },

    async signUp(request) {
      const { error } = await client.auth.signUp({
        email: request.email,
        password: request.password,
        options: {
          emailRedirectTo: request.emailRedirectTo,
          data: {
            display_name: `${request.firstName} ${request.lastName}`.trim(),
          },
        },
      });

      if (error) {
        throw new AuthServiceError(mapAuthError(error));
      }

      return {
        success: true,
        message: 'If registration is available for this email, check your inbox to verify your account.',
      };
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      if (error) {
        throw new AuthServiceError(mapAuthError(error));
      }
    },
  };
}
