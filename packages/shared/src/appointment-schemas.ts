import { z } from 'zod';

const uuidSchema = z.string().uuid();
const dateTimeSchema = z.string().datetime({ offset: true });
const timeZoneSchema = z.string().min(1).max(64);

export const appointmentStatusSchema = z.enum([
  'draft',
  'scheduled',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
]);

export const appointmentTypeSchema = z.enum(['in_person', 'virtual', 'hybrid']);

export const appointmentBufferSchema = z.number().int().min(0).max(1440);

export const recurrencePlaceholderSchema = z.object({
  recurrenceRule: z.string().trim().min(1).max(500),
  recurrenceTimezone: timeZoneSchema,
});

const appointmentInputSchema = z.object({
  patientId: uuidSchema,
  practitionerId: uuidSchema,
  locationId: uuidSchema,
  serviceId: uuidSchema,
  appointmentType: appointmentTypeSchema,
  scheduledStart: dateTimeSchema,
  durationMinutes: z.number().int().min(1).max(1440),
  timezone: timeZoneSchema,
  preBufferMinutes: appointmentBufferSchema,
  postBufferMinutes: appointmentBufferSchema,
  status: z.enum(['draft', 'scheduled']).default('scheduled'),
  notes: z.string().trim().max(1000).optional(),
});

const validateAppointmentTime = (
  value: { scheduledStart: string; durationMinutes: number },
  context: z.RefinementCtx,
) => {
  const start = new Date(value.scheduledStart);
  const end = new Date(start.getTime() + value.durationMinutes * 60_000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scheduledStart'],
      message: 'A valid appointment time is required.',
    });
  }
};

export const appointmentCreateSchema = appointmentInputSchema.superRefine(
  validateAppointmentTime,
);

export const appointmentUpdateSchema = appointmentInputSchema
  .omit({ status: true })
  .superRefine(validateAppointmentTime);

export const appointmentStatusUpdateSchema = z.object({
  appointmentId: uuidSchema,
  status: appointmentStatusSchema,
  reason: z.string().trim().max(500).optional(),
});

export type AppointmentCreateInput = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdateInput = z.infer<typeof appointmentUpdateSchema>;
