import { z } from 'zod';

const uuidSchema = z.string().uuid();
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .optional()
  .or(z.literal(''));

export const practitionerStatusSchema = z.enum([
  'draft',
  'active',
  'inactive',
  'archived',
]);
export const credentialVerificationStatusSchema = z.enum([
  'unverified',
  'pending',
  'verified',
  'rejected',
  'expired',
]);
export const publicVisibilityStatusSchema = z.enum(['private', 'published']);
export const bookingVisibilitySchema = z.enum(['hidden', 'visible']);
export const languageCodeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/, 'Use a valid language code');
export const profileSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Use lowercase words separated by hyphens',
  )
  .max(120);

export const practitionerCreationSchema = z
  .object({
    displayName: z.string().trim().min(1).max(200),
    professionalTitle: optionalText(200),
    status: practitionerStatusSchema
      .extract(['draft', 'active', 'inactive'])
      .default('draft'),
    membershipId: uuidSchema.optional().or(z.literal('')),
    locationIds: z.array(uuidSchema).max(100),
    primaryLocationId: uuidSchema.optional().or(z.literal('')),
    specialtyIds: z.array(uuidSchema).max(100),
    languageCodes: z.array(languageCodeSchema).max(50),
  })
  .superRefine((value, context) => {
    if (
      value.primaryLocationId &&
      !value.locationIds.includes(value.primaryLocationId)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['primaryLocationId'],
        message: 'Primary location must be selected',
      });
    }
  });

export const practitionerEditSchema = z.object({
  practitionerId: uuidSchema,
  displayName: z.string().trim().min(1).max(200),
  professionalTitle: optionalText(200),
  registrationJurisdiction: optionalText(100),
});

export const practitionerStatusActionSchema = z.object({
  practitionerId: uuidSchema,
  status: practitionerStatusSchema,
  reason: optionalText(500),
});

export const practitionerMembershipLinkSchema = z.object({
  practitionerId: uuidSchema,
  membershipId: uuidSchema,
});

export const practitionerMembershipUnlinkSchema = z.object({
  practitionerId: uuidSchema,
});

export const credentialSchema = z
  .object({
    practitionerId: uuidSchema,
    credentialType: z.string().trim().min(1).max(120),
    issuingBody: optionalText(200),
    registrationNumber: optionalText(200),
    jurisdiction: optionalText(100),
    issueDate: dateSchema,
    expiryDate: dateSchema,
    notes: optionalText(2000),
    documentReference: optionalText(500),
    isPrimary: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    if (
      value.issueDate &&
      value.expiryDate &&
      value.expiryDate < value.issueDate
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiryDate'],
        message: 'Expiry date must not precede issue date',
      });
    }
  });

export const credentialVerificationSchema = z.object({
  credentialId: uuidSchema,
  verificationStatus: credentialVerificationStatusSchema,
  notes: optionalText(2000),
});

export const locationSelectionSchema = z
  .object({
    practitionerId: uuidSchema,
    locationIds: z.array(uuidSchema).max(100),
    primaryLocationId: uuidSchema.optional().or(z.literal('')),
  })
  .superRefine((value, context) => {
    if (
      value.primaryLocationId &&
      !value.locationIds.includes(value.primaryLocationId)
    )
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['primaryLocationId'],
        message: 'Primary location must be selected',
      });
  });

export const specialtySelectionSchema = z.object({
  practitionerId: uuidSchema,
  specialtyIds: z.array(uuidSchema).max(100),
});
export const serviceSelectionSchema = z.object({
  practitionerId: uuidSchema,
  serviceIds: z.array(uuidSchema).max(100),
  locationId: uuidSchema.optional().or(z.literal('')),
});
export const languageSelectionSchema = z.object({
  practitionerId: uuidSchema,
  languageCodes: z.array(languageCodeSchema).max(50),
});

export const publicProfileSchema = z.object({
  practitionerId: uuidSchema,
  displayName: optionalText(200),
  professionalTitle: optionalText(200),
  shortBiography: optionalText(500),
  fullBiography: optionalText(5000),
  pronouns: optionalText(100),
  profileImageReference: optionalText(500),
  acceptingNewClients: z.boolean().default(false),
  visibilityStatus: publicVisibilityStatusSchema,
  bookingVisibility: bookingVisibilitySchema,
  profileSlug: profileSlugSchema.optional().or(z.literal('')),
  seoTitle: optionalText(200),
  seoDescription: optionalText(500),
});

export function isPractitionerSelectable(
  status: z.infer<typeof practitionerStatusSchema>,
) {
  return status === 'active';
}

export function credentialDisplayStatus(
  status: z.infer<typeof credentialVerificationStatusSchema>,
  expiryDate?: string | null,
) {
  if (
    expiryDate &&
    expiryDate < new Date().toISOString().slice(0, 10) &&
    status === 'verified'
  )
    return 'expired';
  return status;
}

export type PractitionerCreationInput = z.infer<
  typeof practitionerCreationSchema
>;
export type PractitionerEditInput = z.infer<typeof practitionerEditSchema>;
export type CredentialInput = z.infer<typeof credentialSchema>;
export type PublicProfileInput = z.infer<typeof publicProfileSchema>;
