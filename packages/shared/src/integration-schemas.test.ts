import { describe, expect, it } from 'vitest';
import { integrationApiKeySchema, integrationProviderSchema } from './integration-schemas';

describe('integration schemas', () => {
  it('accepts provider-neutral API key metadata', () => {
    expect(integrationApiKeySchema.safeParse({ name: 'Scheduling client', permissions: ['appointments.read'] }).success).toBe(true);
  });

  it('restricts providers to the approved catalogue', () => {
    expect(integrationProviderSchema.safeParse({ providerKey: 'unknown', displayName: 'Unknown', providerType: 'unknown', active: true }).success).toBe(false);
  });
});
