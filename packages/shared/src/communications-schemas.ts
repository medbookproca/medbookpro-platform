import { z } from 'zod';

export const notificationChannelSchema = z.enum(['email', 'sms', 'internal', 'push', 'whatsapp']);
export const notificationQueueStatusSchema = z.enum(['pending', 'processing', 'sent', 'failed', 'cancelled', 'expired', 'retrying']);
export const notificationTemplateSchema = z.object({
  id: z.string().uuid().optional(), templateKey: z.string().trim().min(1).max(120), channel: notificationChannelSchema,
  subject: z.string().max(500).nullable().optional(), body: z.string().trim().min(1).max(20000), variables: z.record(z.string()).default({}), language: z.string().trim().min(2).max(16).default('en-CA'), status: z.enum(['active', 'inactive']).default('active'),
});
export const notificationQueueSchema = z.object({ id: z.string().uuid().optional(), patientId: z.string().uuid(), appointmentId: z.string().uuid().nullable().optional(), channel: notificationChannelSchema, subject: z.string().max(500).nullable().optional(), body: z.string().min(1), status: notificationQueueStatusSchema, attemptCount: z.number().int().nonnegative(), provider: z.literal('mock'), scheduledSendAt: z.string().datetime(), priority: z.number().int(), failureReason: z.string().nullable().optional() });
export const notificationDeliverySchema = z.object({ id: z.string().uuid(), queueId: z.string().uuid(), channel: notificationChannelSchema, provider: z.literal('mock'), status: z.enum(['sent', 'failed']), providerMessageId: z.string().nullable(), deliveredAt: z.string().datetime().nullable(), failureReason: z.string().nullable() });
export const patientNotificationPreferencesSchema = z.object({ patientId: z.string().uuid(), appointmentReminders: z.boolean(), marketingOptIn: z.boolean(), smsEnabled: z.boolean(), emailEnabled: z.boolean(), preferredLanguage: z.string().trim().min(2).max(16), quietHours: z.record(z.string()).default({}) });
export const organizationNotificationSettingsSchema = z.object({ defaultReminderMinutes: z.coerce.number().int().min(0).max(43200), brandingPlaceholder: z.record(z.string()).default({}), defaultSender: z.string().email().nullable().or(z.literal('')), timezone: z.string().min(1) });
export const mockProviderResultSchema = z.object({ provider: z.literal('mock'), providerMessageId: z.string().startsWith('mock:'), status: z.literal('sent') });

export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
