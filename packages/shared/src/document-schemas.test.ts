import { describe, expect, it } from 'vitest';
import { documentRetentionSchema, documentSchema } from './document-schemas';

describe('document schemas', () => {
  it('accepts metadata without a storage provider', () => {
    expect(documentSchema.safeParse({
      organizationId: '00000000-0000-0000-0000-000000000001',
      title: 'Referral',
      categoryKey: 'referral',
    }).success).toBe(true);
  });

  it('requires a supported retention status', () => {
    expect(documentRetentionSchema.safeParse({ retentionStatus: 'permanent', legalHold: false }).success).toBe(false);
  });
});
