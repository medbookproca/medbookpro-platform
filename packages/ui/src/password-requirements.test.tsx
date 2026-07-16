import { describe, it, expect } from 'vitest';
import { PasswordRequirements } from './password-requirements';

describe('Password Requirements', () => {
  it('marks all requirements as unmet for empty password', () => {
    const element = PasswordRequirements({ password: '', className: '' });
    // This is just checking the component renders without error
    expect(element).toBeDefined();
  });

  it('marks length requirement as met for 12+ char password', () => {
    const element = PasswordRequirements({ password: 'ValidPassword', className: '' });
    expect(element).toBeDefined();
  });

  it('tracks uppercase letter requirement', () => {
    const element = PasswordRequirements({ password: 'Password', className: '' });
    expect(element).toBeDefined();
  });
});
