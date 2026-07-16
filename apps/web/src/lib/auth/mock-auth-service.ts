/**
 * Mock Authentication Service
 *
 * This is a frontend-only mock implementation for UI development.
 * It demonstrates the interface but DOES NOT create real sessions, store tokens,
 * or authenticate users against a backend.
 *
 * This will be replaced by a real Supabase-backed implementation during
 * backend integration phase.
 */

export interface SignInRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignInResponse {
  success: boolean;
  message: string;
}

export interface SignUpRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface SignUpResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  success: boolean;
  message: string;
}

export interface PasswordResetNewRequest {
  password: string;
}

export interface PasswordResetNewResponse {
  success: boolean;
  message: string;
}

export interface AcceptInvitationRequest {
  firstName: string;
  lastName: string;
  password: string;
}

export interface AcceptInvitationResponse {
  success: boolean;
  message: string;
}

export class MockAuthService {
  private static instance: MockAuthService;

  private constructor() {}

  static getInstance(): MockAuthService {
    if (!MockAuthService.instance) {
      MockAuthService.instance = new MockAuthService();
    }
    return MockAuthService.instance;
  }

  /**
   * Mock sign-in handler
   * Simulates form validation and processing
   */
  async signIn(request: SignInRequest): Promise<SignInResponse> {
    // Simulate network delay
    await this.delay(1000);

    // Mock validation - in real implementation, this would be server-side
    if (!request.email || !request.password) {
      throw new Error('Invalid request');
    }

    // Mock success response
    return {
      success: true,
      message: `Sign in mock successful for ${request.email}. In a real implementation, you would now have an authenticated session.`,
    };
  }

  /**
   * Mock sign-up handler
   * Simulates form validation and account creation
   */
  async signUp(request: SignUpRequest): Promise<SignUpResponse> {
    // Simulate network delay
    await this.delay(1000);

    // Mock validation
    if (!request.email || !request.password || !request.firstName || !request.lastName) {
      throw new Error('Invalid request');
    }

    // Mock success response
    return {
      success: true,
      message: `Account creation mock successful for ${request.email}. A verification email will be sent. In a real implementation, email verification would be required before account activation.`,
    };
  }

  /**
   * Mock password reset request
   * Always returns a neutral response to avoid account enumeration
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<PasswordResetResponse> {
    // Simulate network delay
    await this.delay(800);

    if (!request.email) {
      throw new Error('Invalid request');
    }

    // Neutral response regardless of whether account exists
    // In real implementation, email would only be sent if account exists
    return {
      success: true,
      message: 'If an account exists for this email address, a reset link will be sent. Check your inbox and spam folder.',
    };
  }

  /**
   * Mock password reset with new password
   */
  async resetPassword(request: PasswordResetNewRequest): Promise<PasswordResetNewResponse> {
    // Simulate network delay
    await this.delay(1000);

    if (!request.password) {
      throw new Error('Invalid request');
    }

    // Mock success - in real implementation, a valid reset token would be verified server-side
    return {
      success: true,
      message: 'Password reset mock successful. You can now sign in with your new password.',
    };
  }

  /**
   * Mock invitation acceptance
   */
  async acceptInvitation(invitationCode: string, request: AcceptInvitationRequest): Promise<AcceptInvitationResponse> {
    // Simulate network delay
    await this.delay(1000);

    if (!request.firstName || !request.lastName || !request.password || !invitationCode) {
      throw new Error('Invalid request');
    }

    // Mock success response
    return {
      success: true,
      message: `Invitation acceptance mock successful for ${request.firstName} ${request.lastName}. You can now sign in with your credentials.`,
    };
  }

  /**
   * Helper to simulate network delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const mockAuthService = MockAuthService.getInstance();
