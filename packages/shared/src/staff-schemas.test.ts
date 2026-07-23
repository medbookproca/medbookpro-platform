import { describe, expect, it } from 'vitest';
import { invitationAccessSchema, staffInvitationSchema } from './staff-schemas';

describe('staff invitation schemas', () => {
  it('normalizes invitation email', () => {
    expect(staffInvitationSchema.parse({ email: ' Staff@Example.test ', roleKeys: ['receptionist'], access: { mode: 'all', locationIds: [] } }).email).toBe('staff@example.test');
  });

  it('requires locations for selected access', () => {
    expect(invitationAccessSchema.safeParse({ mode: 'selected', locationIds: [] }).success).toBe(false);
    expect(invitationAccessSchema.safeParse({ mode: 'selected', locationIds: ['00000000-0000-0000-0000-000000000001'] }).success).toBe(true);
  });

  it('accepts organization-wide access without location rows', () => {
    expect(invitationAccessSchema.safeParse({ mode: 'all', locationIds: [] }).success).toBe(true);
  });
});
