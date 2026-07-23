import { z } from 'zod';

const uuid = z.string().uuid();

export const integrationProviderSchema = z.object({
  providerKey: z.string().trim().regex(/^[a-z0-9_]+$/),
  displayName: z.string().trim().min(1).max(160),
  providerType: z.enum(['fhir', 'hl7', 'google_calendar', 'microsoft_365_calendar', 'stripe', 'square', 'moneris', 'zoom', 'google_meet', 'twilio', 'sendgrid', 'laboratory', 'imaging_pacs', 'custom']),
  active: z.boolean(),
});

export const integrationConnectionSchema = z.object({
  providerKey: z.string().trim().min(1),
  name: z.string().trim().min(1).max(160),
  externalAccountPlaceholder: z.string().trim().max(255).optional(),
});

export const integrationApiKeySchema = z.object({
  name: z.string().trim().min(1).max(160),
  permissions: z.array(z.string().trim().min(1)).default([]),
  rotationDate: z.string().datetime({ offset: true }).optional(),
});

export const integrationWebhookSchema = z.object({
  connectionId: uuid,
  direction: z.enum(['incoming', 'outgoing']),
  eventType: z.string().trim().min(1).max(160),
  endpointPlaceholder: z.string().trim().max(500).optional(),
  payloadPlaceholder: z.record(z.string(), z.unknown()).default({}),
});

export const integrationJobSchema = z.object({
  jobType: z.string().trim().min(1).max(160),
  connectionId: uuid.optional(),
  payloadMetadata: z.record(z.string(), z.unknown()).default({}),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'cancelled']),
  retryCount: z.number().int().nonnegative(),
});

export const integrationEventSchema = z.object({
  connectionId: uuid.optional(),
  eventType: z.string().trim().min(1).max(160),
  payloadMetadata: z.record(z.string(), z.unknown()).default({}),
});

export type IntegrationProvider = z.infer<typeof integrationProviderSchema>;
export type IntegrationConnection = z.infer<typeof integrationConnectionSchema>;
export type IntegrationApiKey = z.infer<typeof integrationApiKeySchema>;
export type IntegrationWebhook = z.infer<typeof integrationWebhookSchema>;
export type IntegrationJob = z.infer<typeof integrationJobSchema>;
