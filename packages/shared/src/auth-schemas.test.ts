import { describe, it, expect } from 'vitest';
import { signInSchema, signUpSchema, passwordSchema, resetPasswordSchema } from './auth-schemas';

describe('Authentication Schemas', () => {
  describe('passwordSchema', () => {
    it('rejects passwords shorter than 12 characters', () => {
      expect(() => passwordSchema.parse('Pass1!')).toThrow();
    });

    it('requires uppercase letter', () => {
      expect(() => passwordSchema.parse('password123!')).toThrow();
    });

    it('requires lowercase letter', () => {
      expect(() => passwordSchema.parse('PASSWORD123!')).toThrow();
    });

    it('requires number', () => {
      expect(() => passwordSchema.parse('Password!')).toThrow();
    });

    it('requires symbol', () => {
      expect(() => passwordSchema.parse('Password123')).toThrow();
    });

    it('accepts valid password', () => {
      const result = passwordSchema.parse('ValidPassword123!');
      expect(result).toBe('ValidPassword123!');
    });
  });

  describe('signInSchema', () => {
    it('rejects invalid email', () => {
      expect(() =>
        signInSchema.parse({
          email: 'invalid-email',
          password: 'Password123!',
          rememberMe: false,
        })
      ).toThrow();
    });

    it('converts email to lowercase', () => {
      const result = signInSchema.parse({
        email: 'USER@EXAMPLE.COM',
        password: 'Password123!',
      });
      expect(result.email).toBe('user@example.com');
    });

    it('accepts valid sign-in data', () => {
      const result = signInSchema.parse({
        email: 'user@example.com',
        password: 'Password123!',
        rememberMe: true,
      });
      expect(result.email).toBe('user@example.com');
      expect(result.password).toBe('Password123!');
      expect(result.rememberMe).toBe(true);
    });
  });

  describe('signUpSchema', () => {
    it('requires first name', () => {
      expect(() =>
        signUpSchema.parse({
          firstName: '',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'ValidPassword123!',
          confirmPassword: 'ValidPassword123!',
          agreeToTerms: true,
        })
      ).toThrow();
    });

    it('requires password confirmation match', () => {
      expect(() =>
        signUpSchema.parse({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'ValidPassword123!',
          confirmPassword: 'DifferentPassword123!',
          agreeToTerms: true,
        })
      ).toThrow();
    });

    it('requires terms agreement', () => {
      expect(() =>
        signUpSchema.parse({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'ValidPassword123!',
          confirmPassword: 'ValidPassword123!',
          agreeToTerms: false,
        })
      ).toThrow();
    });

    it('accepts valid sign-up data', () => {
      const result = signUpSchema.parse({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        password: 'ValidPassword123!',
        confirmPassword: 'ValidPassword123!',
        agreeToTerms: true,
      });
      expect(result.firstName).toBe('Jane');
      expect(result.email).toBe('jane@example.com');
    });
  });

  describe('resetPasswordSchema', () => {
    it('requires password match', () => {
      expect(() =>
        resetPasswordSchema.parse({
          password: 'ValidPassword123!',
          confirmPassword: 'DifferentPassword123!',
        })
      ).toThrow();
    });

    it('accepts valid reset data', () => {
      const result = resetPasswordSchema.parse({
        password: 'NewPassword123!',
        confirmPassword: 'NewPassword123!',
      });
      expect(result.password).toBe('NewPassword123!');
    });
  });
});
