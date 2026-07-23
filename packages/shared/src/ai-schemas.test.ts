import { describe, expect, it } from 'vitest';
import { aiRequestSchema, aiUsageMetricsSchema } from './ai-schemas';

describe('AI foundation schemas', () => {
  it('requires human review for every request', () => {
    const result = aiRequestSchema.safeParse({
      organizationId: '00000000-0000-0000-0000-000000000001',
      patientId: undefined,
      encounterId: undefined,
      promptVersionId: '00000000-0000-0000-0000-000000000002',
      requestType: 'soap_assistance',
      status: 'queued',
      humanReviewRequired: true,
      blocked: false,
    });

    expect(result.success).toBe(true);
    expect(
      aiRequestSchema.safeParse({ humanReviewRequired: false }).success,
    ).toBe(false);
  });

  it('rejects negative usage metrics', () => {
    expect(
      aiUsageMetricsSchema.safeParse({
        requestCount: 1,
        completedCount: 1,
        blockedCount: 0,
        inputTokensPlaceholder: -1,
        outputTokensPlaceholder: 0,
        costPlaceholder: 0,
      }).success,
    ).toBe(false);
  });
});
