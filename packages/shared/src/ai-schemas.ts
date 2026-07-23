import { z } from 'zod';

const uuid = z.string().uuid();
const nullableUuid = uuid.nullable().optional();

export const aiProviderSchema = z.object({
  providerKey: z.string().regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(1),
  providerType: z.enum([
    'hosted',
    'azure',
    'anthropic',
    'google',
    'aws',
    'local',
    'custom',
  ]),
  active: z.boolean(),
});

export const aiModelSchema = z.object({
  providerId: uuid,
  modelKey: z.string().min(1),
  displayName: z.string().min(1),
  active: z.boolean(),
});

export const aiPromptSchema = z.object({
  organizationId: uuid,
  name: z.string().min(1),
  category: z.enum([
    'clinical',
    'administrative',
    'communication',
    'coding',
    'safety',
  ]),
  status: z.enum(['draft', 'published', 'archived']),
  approvalState: z.enum(['draft', 'pending_review', 'approved', 'rejected']),
});

export const aiPromptVersionSchema = z.object({
  promptId: uuid,
  versionNumber: z.number().int().positive(),
  systemPrompt: z.string(),
  userTemplate: z.string(),
  variables: z.record(z.string()),
  status: z.enum(['draft', 'published', 'archived']),
  approvalState: z.enum(['draft', 'pending_review', 'approved', 'rejected']),
});

export const aiRequestSchema = z.object({
  organizationId: uuid,
  patientId: nullableUuid,
  encounterId: nullableUuid,
  promptVersionId: uuid,
  requestType: z.enum([
    'clinical_note_drafting',
    'soap_assistance',
    'diagnosis_suggestions',
    'procedure_coding',
    'care_plan_drafting',
    'document_summarization',
    'referral_drafting',
    'patient_education',
    'clinical_letter_drafting',
  ]),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'blocked']),
  humanReviewRequired: z.literal(true),
  blocked: z.boolean(),
});

export const aiResponseSchema = z.object({
  requestId: uuid,
  responsePlaceholder: z.string().min(1),
  blocked: z.boolean(),
  confidencePlaceholder: z.number().min(0).max(1).nullable().optional(),
});

export const aiFeedbackSchema = z.object({
  requestId: uuid,
  responseId: nullableUuid,
  rating: z.number().int().min(1).max(5).nullable().optional(),
  feedbackPlaceholder: z.string().nullable().optional(),
});

export const aiUsageMetricsSchema = z.object({
  requestCount: z.number().int().nonnegative(),
  completedCount: z.number().int().nonnegative(),
  blockedCount: z.number().int().nonnegative(),
  inputTokensPlaceholder: z.number().int().nonnegative(),
  outputTokensPlaceholder: z.number().int().nonnegative(),
  costPlaceholder: z.number().nonnegative(),
});

export type AiProvider = z.infer<typeof aiProviderSchema>;
export type AiModel = z.infer<typeof aiModelSchema>;
export type AiPrompt = z.infer<typeof aiPromptSchema>;
export type AiPromptVersion = z.infer<typeof aiPromptVersionSchema>;
export type AiRequest = z.infer<typeof aiRequestSchema>;
export type AiResponse = z.infer<typeof aiResponseSchema>;
export type AiFeedback = z.infer<typeof aiFeedbackSchema>;
export type AiUsageMetrics = z.infer<typeof aiUsageMetricsSchema>;
