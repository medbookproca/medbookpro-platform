import { describe, it, expect } from 'vitest';
import { MockAuthService } from './mock-auth-service';

describe('MockAuthService', () => {
  const service = MockAuthService.getInstance();

  describe('signIn', () => {
    it('returns success response for valid credentials', async () => {
      const response = await service.signIn({
        email: 'user@example.com',
        password: 'password123',
      });
      expect(response.success).toBe(true);
      expect(response.message).toContain('mock successful');
    });

    it('throws error for empty email', async () => {
      await expect(
        service.signIn({
          email: '',
          password: 'password123',
        })
      ).rejects.toThrow();
    });
  });

  describe('signUp', () => {
    it('returns success response for valid data', async () => {
      const response = await service.signUp({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });
      expect(response.success).toBe(true);
      expect(response.message).toContain('mock successful');
    });

    it('throws error for missing fields', async () => {
      await expect(
        service.signUp({
          firstName: '',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'Password123!',
        })
      ).rejects.toThrow();
    });
  });

  describe('requestPasswordReset', () => {
    it('returns neutral response regardless of email', async () => {
      const response = await service.requestPasswordReset({
        email: 'user@example.com',
      });
      expect(response.success).toBe(true);
      expect(response.message).toContain('If an account exists');
    });

    it('throws error for empty email', async () => {
      await expect(
        service.requestPasswordReset({
          email: '',
        })
      ).rejects.toThrow();
    });
  });

  describe('resetPassword', () => {
    it('returns success response', async () => {
      const response = await service.resetPassword({
        password: 'NewPassword123!',
      });
      expect(response.success).toBe(true);
      expect(response.message).toContain('mock successful');
    });
  });

  describe('acceptInvitation', () => {
    it('returns success response for valid data', async () => {
      const response = await service.acceptInvitation('invitation-code', {
        firstName: 'Jane',
        lastName: 'Doe',
        password: 'Password123!',
      });
      expect(response.success).toBe(true);
      expect(response.message).toContain('mock successful');
    });

    it('throws error for missing fields', async () => {
      await expect(
        service.acceptInvitation('', {
          firstName: 'Jane',
          lastName: 'Doe',
          password: 'Password123!',
        })
      ).rejects.toThrow();
    });
  });
});
