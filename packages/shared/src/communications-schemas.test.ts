import { describe, expect, it } from 'vitest';
import { mockProviderResultSchema, notificationQueueStatusSchema, notificationTemplateSchema } from './communications-schemas';

describe('communications schemas', () => {
  it('accepts a versionable Canadian notification template', () => {
    expect(notificationTemplateSchema.parse({ templateKey: 'appointment.reminder', channel: 'email', body: 'Reminder', language: 'en-CA' }).language).toBe('en-CA');
  });

  it('keeps queue lifecycle and mock provider values bounded', () => {
    expect(notificationQueueStatusSchema.parse('retrying')).toBe('retrying');
    expect(mockProviderResultSchema.safeParse({ provider: 'mock', providerMessageId: 'mock:local', status: 'sent' }).success).toBe(true);
    expect(mockProviderResultSchema.safeParse({ provider: 'smtp', providerMessageId: 'smtp:remote', status: 'sent' }).success).toBe(false);
  });
});
