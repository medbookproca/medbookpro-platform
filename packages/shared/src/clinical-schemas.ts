import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const encounterStatusSchema = z.enum([
  'draft',
  'in_progress',
  'completed',
  'amended',
  'archived',
]);

export const encounterCreateSchema = z.object({
  patientId: uuidSchema,
  practitionerId: uuidSchema,
  appointmentId: uuidSchema.optional(),
  encounterType: z.string().trim().min(1).max(120),
  status: z.enum(['draft', 'in_progress']).default('draft'),
});

export const encounterUpdateSchema = z.object({
  encounterId: uuidSchema,
  encounterType: z.string().trim().min(1).max(120),
  startedAt: z.string().datetime({ offset: true }).optional(),
});

export const encounterStatusUpdateSchema = z.object({
  encounterId: uuidSchema,
  status: encounterStatusSchema,
  reason: z.string().trim().max(500).optional(),
});

const clinicalText = z.string().max(20_000);

export const soapNoteSchema = z.object({
  encounterId: uuidSchema,
  subjective: clinicalText,
  objective: clinicalText,
  assessment: clinicalText,
  plan: clinicalText,
});

export const carePlanSchema = z.object({
  carePlanId: uuidSchema.optional(),
  encounterId: uuidSchema,
  goals: clinicalText,
  interventions: clinicalText,
  followUpNotes: clinicalText,
  status: z.enum(['active', 'on_hold', 'completed', 'discontinued']),
  reviewDate: z.string().date().optional(),
});

export const clinicalFormSchema = z.object({
  formId: uuidSchema.optional(),
  encounterId: uuidSchema,
  formType: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  version: z.string().trim().min(1).max(40),
  completionStatus: z.enum(['draft', 'in_progress', 'completed', 'void']),
  structuredResponse: z.record(z.unknown()),
});

export const clinicalAttachmentSchema = z.object({
  encounterId: uuidSchema,
  filename: z.string().trim().min(1).max(255),
  mediaType: z.string().trim().min(1).max(160),
  sizeBytes: z.number().int().min(0).max(10_737_418_240),
  storageReference: z.string().trim().min(1).max(500),
});

export const diagnosisSchema = z.object({
  diagnosisId: uuidSchema.optional(),
  encounterId: uuidSchema,
  codingSystem: z.string().trim().min(1).max(80),
  code: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(500),
  isPrimary: z.boolean(),
});

export const procedureSchema = z.object({
  procedureId: uuidSchema.optional(),
  encounterId: uuidSchema,
  code: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(500),
  performedDate: z.string().date(),
  practitionerId: uuidSchema,
});

export type EncounterCreateInput = z.infer<typeof encounterCreateSchema>;
export type SoapNoteInput = z.infer<typeof soapNoteSchema>;
export type CarePlanInput = z.infer<typeof carePlanSchema>;
