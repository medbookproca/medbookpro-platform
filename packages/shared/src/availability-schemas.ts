import { z } from 'zod';

const uuidSchema = z.string().uuid();
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM');
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const optionalUuid = uuidSchema.optional().or(z.literal(''));

export const availabilityModeSchema = z.enum(['virtual', 'in_person', 'mixed']);
export const availabilityWeekdaySchema = z.number().int().min(0).max(6);
export const availabilityOverrideKindSchema = z.enum([
  'available',
  'unavailable',
]);
export const timeOffCategorySchema = z.enum([
  'vacation',
  'sick',
  'holiday',
  'other',
]);

const intervalRefinement = <T extends { startTime: string; endTime: string }>(
  schema: z.ZodType<T>,
) =>
  schema.superRefine((value, context) => {
    if (value.endTime <= value.startTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'End time must be after start time',
      });
    }
  });

export const availabilityBlockSchema = intervalRefinement(
  z.object({
    weekday: availabilityWeekdaySchema,
    startTime: timeSchema,
    endTime: timeSchema,
    mode: availabilityModeSchema,
    locationId: optionalUuid,
    serviceId: optionalUuid,
    capacityHint: z.number().int().min(1).max(100).default(1),
  }),
);

export const availabilityBreakSchema = intervalRefinement(
  z.object({
    blockId: uuidSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    label: z.string().trim().min(1).max(160),
  }),
);

export const availabilityOverrideSchema = z
  .object({
    practitionerId: uuidSchema,
    overrideDate: dateSchema,
    kind: availabilityOverrideKindSchema,
    startTime: timeSchema.optional().or(z.literal('')),
    endTime: timeSchema.optional().or(z.literal('')),
    mode: availabilityModeSchema,
    locationId: optionalUuid,
    serviceId: optionalUuid,
    reason: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .superRefine((value, context) => {
    if (
      (value.startTime || value.endTime) &&
      (!value.startTime || !value.endTime)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'Both override times are required',
      });
    }
    if (value.startTime && value.endTime && value.endTime <= value.startTime) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'End time must be after start time',
      });
    }
  });

export const timeOffSchema = z
  .object({
    practitionerId: uuidSchema,
    category: timeOffCategorySchema,
    startDate: dateSchema,
    endDate: dateSchema,
    allDay: z.boolean().default(true),
    reason: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .refine((value) => value.endDate >= value.startDate, {
    path: ['endDate'],
    message: 'End date must not precede start date',
  });

export const organizationHolidaySchema = z.object({
  holidayId: uuidSchema.optional(),
  holidayDate: dateSchema,
  name: z.string().trim().min(1).max(160),
  locationId: optionalUuid,
  status: z.enum(['active', 'cancelled']).default('active'),
});

export const locationAvailabilitySchema = intervalRefinement(
  z.object({
    locationId: uuidSchema,
    weekday: availabilityWeekdaySchema,
    startTime: timeSchema,
    endTime: timeSchema,
    mode: z.enum(['in_person', 'mixed']).default('in_person'),
  }),
);

export const serviceAvailabilitySchema = intervalRefinement(
  z.object({
    serviceId: uuidSchema,
    locationId: optionalUuid,
    weekday: availabilityWeekdaySchema,
    startTime: timeSchema,
    endTime: timeSchema,
    mode: availabilityModeSchema,
  }),
);

export const scheduleTemplateSchema = z.object({
  practitionerId: uuidSchema,
  name: z.string().trim().min(1).max(160),
  timezone: z.string().trim().min(1).max(64),
  effectiveFrom: dateSchema.optional().or(z.literal('')),
  effectiveTo: dateSchema.optional().or(z.literal('')),
  blocks: z.array(availabilityBlockSchema).max(200),
  breaks: z.array(availabilityBreakSchema).max(200),
});

export const previewAvailabilitySchema = z.object({
  practitionerId: uuidSchema,
  startDate: dateSchema,
  endDate: dateSchema,
  locationId: optionalUuid,
  serviceId: optionalUuid,
});

export function subtractAvailabilityBreaks(
  interval: { startTime: string; endTime: string },
  breaks: Array<{ startTime: string; endTime: string }>,
) {
  return breaks.reduce(
    (segments, currentBreak) =>
      segments.flatMap((segment) => {
        if (
          currentBreak.endTime <= segment.startTime ||
          currentBreak.startTime >= segment.endTime
        )
          return [segment];
        const result = [];
        if (currentBreak.startTime > segment.startTime)
          result.push({
            startTime: segment.startTime,
            endTime: currentBreak.startTime,
          });
        if (currentBreak.endTime < segment.endTime)
          result.push({
            startTime: currentBreak.endTime,
            endTime: segment.endTime,
          });
        return result;
      }),
    [interval],
  );
}

export type AvailabilityBlockInput = z.infer<typeof availabilityBlockSchema>;
export type AvailabilityBreakInput = z.infer<typeof availabilityBreakSchema>;
export type AvailabilityOverrideInput = z.infer<
  typeof availabilityOverrideSchema
>;
export type TimeOffInput = z.infer<typeof timeOffSchema>;
export type ScheduleTemplateInput = z.infer<typeof scheduleTemplateSchema>;
