import { z } from 'zod';

const uuid = z.string().uuid();

export const telehealthSessionSchema = z.object({
  organizationId: uuid,
  locationId: uuid.optional(),
  appointmentId: uuid,
  patientId: uuid,
  practitionerId: uuid,
  scheduledStart: z.string().datetime({ offset: true }),
  scheduledEnd: z.string().datetime({ offset: true }),
  status: z.enum(['scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show']),
  provider: z.string().optional(),
});

export const telehealthParticipantSchema = z.object({
  sessionId: uuid,
  participantType: z.enum(['patient', 'practitioner', 'observer']),
  patientId: uuid.optional(),
  practitionerId: uuid.optional(),
  admitted: z.boolean(),
});

export const telehealthWaitingRoomSchema = z.object({
  sessionId: uuid,
  patientId: uuid,
  status: z.enum(['waiting', 'admitted', 'left']),
  patientJoinedAt: z.string().datetime({ offset: true }).optional(),
  providerJoinedAt: z.string().datetime({ offset: true }).optional(),
  admittedAt: z.string().datetime({ offset: true }).optional(),
  leftAt: z.string().datetime({ offset: true }).optional(),
});

export const telehealthProviderSettingsSchema = z.object({
  provider: z.enum(['zoom', 'google_meet', 'microsoft_teams', 'daily', 'twilio', 'custom_provider']),
  displayName: z.string().trim().max(160).optional(),
  enabled: z.boolean(),
});

export const telehealthSessionEventSchema = z.object({
  sessionId: uuid,
  eventType: z.string().trim().regex(/^[a-z0-9_]+$/).max(120),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export type TelehealthSession = z.infer<typeof telehealthSessionSchema>;
export type TelehealthParticipant = z.infer<typeof telehealthParticipantSchema>;
export type TelehealthWaitingRoom = z.infer<typeof telehealthWaitingRoomSchema>;
export type TelehealthProviderSettings = z.infer<typeof telehealthProviderSettingsSchema>;
