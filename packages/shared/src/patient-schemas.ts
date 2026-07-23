import { z } from 'zod';

const uuidSchema = z.string().uuid();
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');

export const patientStatusSchema = z.enum([
  'draft',
  'active',
  'inactive',
  'archived',
]);
export const biologicalSexSchema = z.enum([
  'female',
  'male',
  'intersex',
  'unknown',
  'undisclosed',
]);
export const maritalStatusSchema = z.enum([
  'single',
  'married',
  'common_law',
  'separated',
  'divorced',
  'widowed',
  'unknown',
  'undisclosed',
]);
export const preferredContactMethodSchema = z.enum([
  'email',
  'sms',
  'phone',
  'none',
]);
export const relationshipTypeSchema = z.enum([
  'spouse',
  'child',
  'parent',
  'dependent',
  'caregiver',
]);
export const identifierTypeSchema = z.enum([
  'internal_mrn',
  'provincial_health_number',
  'passport',
  'drivers_licence',
  'other',
]);
export const consentTypeSchema = z.enum([
  'privacy_acknowledgement',
  'communication',
  'treatment',
]);

export const emailSchema = z.string().trim().email().max(320);
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9][0-9 ()-]{6,24}$/, 'Use a valid phone number')
  .max(32);
export const postalCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9 -]{2,11}$/, 'Use a valid postal code');
export const provinceSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2,3}$/, 'Use a province or state code');
export const dateOfBirthSchema = dateSchema.refine(
  (value) => value <= new Date().toISOString().slice(0, 10),
  'Date of birth cannot be in the future',
);

const patientProfileFields = z.object({
  patientNumber: optionalText(80),
  firstName: z.string().trim().min(1).max(120),
  middleName: optionalText(120),
  lastName: z.string().trim().min(1).max(120),
  preferredName: optionalText(120),
  legalName: optionalText(300),
  dateOfBirth: dateOfBirthSchema,
  biologicalSex: biologicalSexSchema,
  genderIdentity: optionalText(120),
  pronouns: optionalText(80),
  maritalStatus: maritalStatusSchema,
  occupation: optionalText(160),
  preferredLanguage: z.string().trim().min(2).max(16),
  interpreterRequired: z.boolean().default(false),
  accessibilityNotes: optionalText(1000),
  photoReference: optionalText(500),
  nonClinicalNotes: optionalText(1000),
});

export const patientCreationSchema = patientProfileFields.extend({
  organizationId: uuidSchema,
  status: patientStatusSchema
    .extract(['draft', 'active', 'inactive'])
    .default('draft'),
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
});

export const patientUpdateSchema = patientProfileFields.extend({
  patientId: uuidSchema,
});

export const patientStatusActionSchema = z.object({
  patientId: uuidSchema,
  status: patientStatusSchema,
  reason: optionalText(500),
});

export const patientContactSchema = z.object({
  patientId: uuidSchema,
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
  alternatePhone: phoneSchema.optional().or(z.literal('')),
  address: optionalText(240),
  city: optionalText(120),
  province: provinceSchema.optional().or(z.literal('')),
  postalCode: postalCodeSchema.optional().or(z.literal('')),
  country: z.string().trim().min(2).max(80),
  emailAllowed: z.boolean().default(false),
  smsAllowed: z.boolean().default(false),
  phoneAllowed: z.boolean().default(false),
  marketingOptIn: z.boolean().default(false),
  reminderPreference: optionalText(80),
  preferredContactMethod: preferredContactMethodSchema,
});

export const patientIdentifierSchema = z.object({
  patientId: uuidSchema,
  identifierType: identifierTypeSchema,
  identifierValue: z.string().trim().min(1).max(200),
  issuingJurisdiction: optionalText(100),
  isPrimary: z.boolean().default(false),
});

export const emergencyContactSchema = z.object({
  patientId: uuidSchema,
  name: z.string().trim().min(1).max(200),
  relationship: z.string().trim().min(1).max(100),
  phone: phoneSchema,
  alternatePhone: phoneSchema.optional().or(z.literal('')),
  email: emailSchema.optional().or(z.literal('')),
  address: optionalText(240),
  isPrimary: z.boolean().default(false),
});

export const consentSchema = z.object({
  patientId: uuidSchema,
  consentType: consentTypeSchema,
  consentDate: dateSchema,
  version: z.string().trim().min(1).max(40),
  documentReference: optionalText(500),
  withdrawn: z.boolean().default(false),
});

export const duplicatePreviewSchema = z.object({
  organizationId: uuidSchema,
  firstName: z.string().trim().min(1).max(120),
  middleName: optionalText(120),
  lastName: z.string().trim().min(1).max(120),
  dateOfBirth: dateOfBirthSchema,
  email: emailSchema.optional().or(z.literal('')),
  phone: phoneSchema.optional().or(z.literal('')),
});

export const patientSearchSchema = z.object({
  query: z.string().trim().max(120).default(''),
  status: patientStatusSchema.optional(),
});

export type PatientCreationInput = z.infer<typeof patientCreationSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
export type PatientContactInput = z.infer<typeof patientContactSchema>;
export type PatientIdentifierInput = z.infer<typeof patientIdentifierSchema>;
export type EmergencyContactInput = z.infer<typeof emergencyContactSchema>;
export type ConsentInput = z.infer<typeof consentSchema>;
