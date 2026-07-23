import { describe, expect, it } from 'vitest';
import {
  encounterCreateSchema,
  clinicalFormSchema,
  soapNoteSchema,
} from './clinical-schemas';

const encounterId = '81000000-0000-0000-0000-000000000001';

describe('clinical schemas', () => {
  it('validates an appointment-linked encounter', () => {
    expect(
      encounterCreateSchema.parse({
        patientId: '82000000-0000-0000-0000-000000000001',
        practitionerId: '83000000-0000-0000-0000-000000000001',
        appointmentId: '84000000-0000-0000-0000-000000000001',
        encounterType: 'visit',
      }).status,
    ).toBe('draft');
  });

  it('requires all structured SOAP sections', () => {
    expect(() =>
      soapNoteSchema.parse({
        encounterId,
        subjective: 'S',
        objective: 'O',
        assessment: 'A',
      }),
    ).toThrow();
  });

  it('keeps form responses object-shaped', () => {
    expect(() =>
      clinicalFormSchema.parse({
        formId: encounterId,
        encounterId,
        formType: 'intake',
        title: 'Intake',
        version: '1',
        completionStatus: 'draft',
        structuredResponse: [],
      }),
    ).toThrow();
  });
});
