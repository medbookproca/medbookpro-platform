import { z } from 'zod';

const countryCodeSchema = z.string().trim().regex(/^[A-Za-z]{2}$/, 'Use a two-letter country code').transform((value) => value.toUpperCase());
const currencySchema = z.string().trim().regex(/^[A-Za-z]{3}$/, 'Use a three-letter currency code').transform((value) => value.toUpperCase());
const localeSchema = z.string().trim().regex(/^[a-z]{2,3}-[A-Z]{2}$/, 'Use a locale such as en-CA');
const timezoneSchema = z.string().trim().min(1, 'Timezone is required').refine((value) => value.includes('/'), 'Use a valid IANA timezone');
const phoneSchema = z.string().trim().max(40, 'Phone number is too long').regex(/^[+0-9().\-\s]*$/, 'Enter a valid phone number').optional().or(z.literal(''));
const emailSchema = z.string().trim().email('Enter a valid email address').max(254, 'Email address is too long').optional().or(z.literal(''));

export const organizationOnboardingSchema = z.object({
  legalName: z.string().trim().min(1, 'Legal name is required').max(200, 'Legal name is too long'),
  displayName: z.string().trim().min(1, 'Operating name is required').max(200, 'Operating name is too long'),
  countryCode: countryCodeSchema,
  timezone: timezoneSchema,
  currency: currencySchema,
  locale: localeSchema,
});

export const firstLocationSchema = z.object({
  name: z.string().trim().min(1, 'Location name is required').max(200, 'Location name is too long'),
  code: z.string().trim().max(64, 'Location code is too long').regex(/^[a-zA-Z0-9_-]*$/, 'Use letters, numbers, hyphens, or underscores').optional().or(z.literal('')),
  locationType: z.enum(['physical', 'virtual']),
  addressLine1: z.string().trim().max(200, 'Address is too long').optional().or(z.literal('')),
  addressLine2: z.string().trim().max(200, 'Address is too long').optional().or(z.literal('')),
  city: z.string().trim().max(100, 'City is too long').optional().or(z.literal('')),
  provinceOrState: z.string().trim().max(100, 'Province or state is too long').optional().or(z.literal('')),
  postalCode: z.string().trim().max(20, 'Postal code is too long').optional().or(z.literal('')),
  countryCode: countryCodeSchema,
  timezone: timezoneSchema,
  phone: phoneSchema,
  email: emailSchema,
  publicBookingEnabled: z.boolean(),
}).superRefine((location, context) => {
  if (location.locationType === 'physical' && !location.addressLine1) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['addressLine1'], message: 'Address is required for a physical location' });
  }
  if (location.countryCode === 'CA' && location.postalCode && !/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(location.postalCode)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['postalCode'], message: 'Enter a valid Canadian postal code' });
  }
});

export const onboardingFormSchema = z.object({
  organization: organizationOnboardingSchema,
  location: firstLocationSchema,
});

export const onboardingRequestSchema = onboardingFormSchema.extend({
  idempotencyKey: z.string().regex(/^[a-zA-Z0-9_-]{16,128}$/, 'Invalid onboarding request key'),
});

export type OrganizationOnboardingInput = z.infer<typeof organizationOnboardingSchema>;
export type FirstLocationInput = z.infer<typeof firstLocationSchema>;
export type OnboardingFormInput = z.infer<typeof onboardingFormSchema>;
export type OnboardingRequest = z.infer<typeof onboardingRequestSchema>;
