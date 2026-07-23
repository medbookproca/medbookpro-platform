import { z } from 'zod';

const uuid = z.string().uuid();

export const patientPortalProfileSchema = z.object({
  patientId: uuid,
  preferredName: z.string().trim().max(160).optional(),
  preferredLanguage: z.string().trim().min(2).max(10),
  email: z.string().email().optional(),
  phone: z.string().trim().max(32).optional(),
});

export const patientAppointmentRequestSchema = z.object({
  organizationId: uuid,
  practitionerId: uuid,
  locationId: uuid,
  serviceId: uuid,
  appointmentType: z.enum(['in_person', 'virtual', 'phone']),
  scheduledStart: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(1).max(1440),
  timezone: z.string().trim().min(1).max(80),
  notes: z.string().trim().max(2000).optional(),
});

export const patientPortalPreferencesSchema = z.object({
  appointmentReminders: z.boolean(),
  marketingOptIn: z.boolean(),
  smsEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  preferredLanguage: z.string().trim().min(2).max(10),
  quietHours: z.record(z.string(), z.unknown()).default({}),
});

export const patientPortalConsentSchema = z.object({
  consentType: z.enum(['privacy_acknowledgement', 'communication', 'treatment']),
  version: z.string().trim().min(1).max(40),
  consentDate: z.string().date(),
  documentReference: z.string().trim().max(255).optional(),
});

export const patientPortalDashboardSchema = z.object({
  profile: z.object({
    patientId: uuid,
    preferredName: z.string().nullable(),
    preferredLanguage: z.string().nullable(),
  }),
  upcomingAppointments: z.array(z.record(z.string(), z.unknown())),
  outstandingBalance: z.number(),
  unreadCommunications: z.number().int().nonnegative(),
  acceptedConsentCount: z.number().int().nonnegative(),
});

export type PatientPortalProfile = z.infer<typeof patientPortalProfileSchema>;
export type PatientAppointmentRequest = z.infer<typeof patientAppointmentRequestSchema>;
export type PatientPortalPreferences = z.infer<typeof patientPortalPreferencesSchema>;
export type PatientPortalConsent = z.infer<typeof patientPortalConsentSchema>;
