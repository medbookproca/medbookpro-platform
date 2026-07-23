import { z } from 'zod';

const uuid = z.string().uuid();
const description = z.string().trim().max(2000).optional().or(z.literal(''));

export const serviceCreationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description,
  displayOrder: z.number().int().min(0).max(100000),
});

export const serviceUpdateSchema = serviceCreationSchema.extend({
  serviceId: uuid,
});

export const serviceArchiveSchema = z.object({ serviceId: uuid });

export type ServiceCreationInput = z.infer<typeof serviceCreationSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
