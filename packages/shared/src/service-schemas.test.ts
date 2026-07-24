import { describe, expect, it } from 'vitest';
import { serviceCreationSchema, serviceUpdateSchema } from './service-schemas';

describe('service schemas', () => {
  it('accepts bounded service metadata', () => {
    expect(
      serviceCreationSchema.parse({
        name: 'Initial consultation',
        description: 'First visit',
        displayOrder: 1,
      }),
    ).toMatchObject({ name: 'Initial consultation', displayOrder: 1 });
  });

  it('rejects an invalid service identifier', () => {
    expect(
      serviceUpdateSchema.safeParse({
        serviceId: 'not-a-uuid',
        name: 'Consultation',
        displayOrder: 0,
      }).success,
    ).toBe(false);
  });
});
