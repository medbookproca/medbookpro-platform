'use server';

import {
  invitationTokenSchema,
  membershipAccessUpdateSchema,
  membershipStatusActionSchema,
  staffInvitationSchema,
} from '@medbookpro/shared';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

const invitationIdSchema = z.string().uuid();

export type StaffActionResult = { error?: string; success?: string; acceptanceUrl?: string };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The request could not be completed.';
}

async function organizationForCurrentUser() {
  const user = await requireAuthenticatedUser('/app/settings/staff');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) throw new Error('No active organization is available.');
  return { user, organization };
}

export async function createStaffInvitationAction(formData: FormData): Promise<StaffActionResult> {
  try {
    const { user, organization } = await organizationForCurrentUser();
    const input = staffInvitationSchema.parse({
      email: formData.get('email'),
      roleKeys: formData.getAll('roleKeys'),
      access: {
        mode: formData.get('accessMode'),
        locationIds: formData.getAll('locationIds'),
      },
    });
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_staff_invitation', {
      p_organization_id: organization.organizationId,
      p_email: input.email,
      p_role_keys: input.roleKeys,
      p_access_mode: input.access.mode,
      p_location_ids: input.access.locationIds,
      p_idempotency_key: crypto.randomUUID(),
    });
    if (error) throw error;
    const invitation = Array.isArray(data) ? data[0] : data;
    const token = invitation?.acceptance_token;
    const acceptanceUrl = token && process.env.NODE_ENV !== 'production'
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/invitations/accept?token=${token}`
      : undefined;
    revalidatePath('/app/settings/staff');
    return { success: `Invitation created for ${input.email}.`, acceptanceUrl };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function resendStaffInvitationAction(formData: FormData): Promise<StaffActionResult> {
  try {
    await organizationForCurrentUser();
    const invitationId = invitationIdSchema.parse(formData.get('invitationId'));
    const supabase = await createClient();
    const { error } = await supabase.rpc('resend_staff_invitation', { p_invitation_id: invitationId });
    if (error) throw error;
    revalidatePath('/app/settings/staff');
    return { success: 'Invitation resent.' };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function cancelStaffInvitationAction(formData: FormData): Promise<StaffActionResult> {
  try {
    await organizationForCurrentUser();
    const invitationId = invitationIdSchema.parse(formData.get('invitationId'));
    const supabase = await createClient();
    const { error } = await supabase.rpc('cancel_staff_invitation', { p_invitation_id: invitationId, p_reason: 'Cancelled by staff administrator' });
    if (error) throw error;
    revalidatePath('/app/settings/staff');
    return { success: 'Invitation cancelled.' };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function updateMembershipAccessAction(formData: FormData): Promise<StaffActionResult> {
  try {
    await organizationForCurrentUser();
    const input = membershipAccessUpdateSchema.parse({
      membershipId: formData.get('membershipId'),
      roleKeys: formData.getAll('roleKeys'),
      access: { mode: formData.get('accessMode'), locationIds: formData.getAll('locationIds') },
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_membership_roles_and_access', {
      p_membership_id: input.membershipId,
      p_role_keys: input.roleKeys,
      p_access_mode: input.access.mode,
      p_location_ids: input.access.locationIds,
    });
    if (error) throw error;
    revalidatePath('/app/settings/staff');
    return { success: 'Membership access updated.' };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function updateMembershipStatusAction(formData: FormData): Promise<StaffActionResult> {
  try {
    await organizationForCurrentUser();
    const input = membershipStatusActionSchema.parse({
      membershipId: formData.get('membershipId'),
      status: formData.get('status'),
      reason: formData.get('reason') ?? '',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_membership_status', {
      p_membership_id: input.membershipId,
      p_status: input.status,
      p_reason: input.reason || undefined,
    });
    if (error) throw error;
    revalidatePath('/app/settings/staff');
    return { success: `Membership ${input.status}.` };
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function acceptStaffInvitationAction(formData: FormData): Promise<StaffActionResult> {
  try {
    const token = invitationTokenSchema.parse(formData.get('token'));
    const supabase = await createClient();
    const { error } = await supabase.rpc('accept_staff_invitation', { p_token: token });
    if (error) throw error;
    redirect('/app');
  } catch (error) {
    return { error: errorMessage(error) };
  }
}

export async function acceptStaffInvitationFormAction(formData: FormData): Promise<void> {
  await acceptStaffInvitationAction(formData);
}
