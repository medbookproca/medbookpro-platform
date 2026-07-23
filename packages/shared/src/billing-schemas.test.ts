import { describe, expect, it } from 'vitest';
import { creditNoteSchema, invoiceSchema, paymentSchema } from './billing-schemas';

describe('billing schemas', () => {
  it('requires at least one bounded invoice item', () => {
    expect(invoiceSchema.safeParse({ patientId: '00000000-0000-0000-0000-000000000001', items: [] }).success).toBe(false);
    expect(invoiceSchema.parse({ patientId: '00000000-0000-0000-0000-000000000001', items: [{ description: 'Consultation', quantity: 1, unitPrice: 100 }] }).currency).toBe('CAD');
  });
  it('keeps payment methods provider-neutral and credit reasons required', () => {
    expect(paymentSchema.parse({ patientId: '00000000-0000-0000-0000-000000000001', method: 'card_placeholder', amount: 50 }).currency).toBe('CAD');
    expect(creditNoteSchema.safeParse({ invoiceId: '00000000-0000-0000-0000-000000000001', amount: 10, kind: 'partial', reason: '' }).success).toBe(false);
  });
});
