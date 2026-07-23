import { z } from 'zod';

const uuid = z.string().uuid();

export const documentCategorySchema = z.object({
  categoryKey: z.string().trim().regex(/^[a-z0-9_]+$/).max(80),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).optional(),
  active: z.boolean().default(true),
});

export const documentSchema = z.object({
  organizationId: uuid,
  title: z.string().trim().min(1).max(240),
  description: z.string().trim().max(5000).optional(),
  categoryKey: z.string().trim().regex(/^[a-z0-9_]+$/).max(80),
  patientId: uuid.optional(),
  encounterId: uuid.optional(),
  locationId: uuid.optional(),
  practitionerId: uuid.optional(),
  mimeType: z.string().trim().max(160).optional(),
  fileSizeBytes: z.number().int().nonnegative().max(10737418240).optional(),
  checksumPlaceholder: z.string().trim().max(255).optional(),
  storageProviderPlaceholder: z.string().trim().max(120).optional(),
  storagePathPlaceholder: z.string().trim().max(500).optional(),
});

export const documentVersionSchema = z.object({
  documentId: uuid,
  versionNumber: z.number().int().positive(),
  isCurrent: z.boolean(),
  previousVersionId: uuid.optional(),
  title: z.string().trim().max(240).optional(),
  mimeType: z.string().trim().max(160).optional(),
  fileSizeBytes: z.number().int().nonnegative().max(10737418240).optional(),
});

export const documentRetentionSchema = z.object({
  retentionStatus: z.enum(['active', 'retained', 'legal_hold', 'eligible_for_deletion']),
  scheduledDeletionAt: z.string().datetime({ offset: true }).optional(),
  legalHold: z.boolean(),
});

export const documentMetadataSchema = z.object({
  documentId: uuid,
  title: z.string().trim().min(1).max(240),
  category: z.string().trim().min(1).max(120),
  archived: z.boolean(),
  deleted: z.boolean(),
});

export type DocumentInput = z.infer<typeof documentSchema>;
export type DocumentCategory = z.infer<typeof documentCategorySchema>;
export type DocumentVersion = z.infer<typeof documentVersionSchema>;
export type DocumentRetention = z.infer<typeof documentRetentionSchema>;
