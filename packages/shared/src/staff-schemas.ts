import { z } from 'zod';

export const invitationEmailSchema = z.string().trim().email('Enter a valid email address').max(254).transform((value) => value.toLowerCase());
export const invitationTokenSchema = z.string().regex(/^[a-f0-9]{64}$/, 'Invalid invitation token');
export const roleAssignmentSchema = z.array(z.string().regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/)).min(1, 'Select at least one role').max(10);
export const locationAccessModeSchema = z.enum(['all', 'selected']);
export const selectedLocationIdsSchema = z.array(z.string().uuid()).max(100);

export const invitationAccessSchema = z.object({
  mode: locationAccessModeSchema,
  locationIds: selectedLocationIdsSchema,
}).superRefine((value, context) => {
  if (value.mode === 'selected' && value.locationIds.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['locationIds'], message: 'Select at least one location' });
  }
});

export const staffInvitationSchema = z.object({
  email: invitationEmailSchema,
  roleKeys: roleAssignmentSchema,
  access: invitationAccessSchema,
});

export const membershipStatusActionSchema = z.object({
  membershipId: z.string().uuid(),
  status: z.enum(['active', 'suspended', 'removed']),
  reason: z.string().trim().max(500).optional().or(z.literal('')),
});

export const membershipAccessUpdateSchema = z.object({
  membershipId: z.string().uuid(),
  roleKeys: roleAssignmentSchema,
  access: invitationAccessSchema,
});

export type StaffInvitationInput = z.infer<typeof staffInvitationSchema>;
export type InvitationAccess = z.infer<typeof invitationAccessSchema>;
export type MembershipStatusAction = z.infer<typeof membershipStatusActionSchema>;
export type MembershipAccessUpdate = z.infer<typeof membershipAccessUpdateSchema>;
