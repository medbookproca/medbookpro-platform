'use server';

import {
  credentialSchema,
  credentialVerificationSchema,
  languageSelectionSchema,
  locationSelectionSchema,
  practitionerCreationSchema,
  practitionerEditSchema,
  practitionerMembershipLinkSchema,
  practitionerMembershipUnlinkSchema,
  practitionerStatusActionSchema,
  publicProfileSchema,
  serviceSelectionSchema,
  specialtySelectionSchema,
} from '@medbookpro/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export type PractitionerActionResult = { error?: string; success?: string };

function safeError(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'The practitioner request could not be completed.';
}

async function requireOrganization() {
  const user = await requireAuthenticatedUser('/app/practitioners');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) throw new Error('No active organization is available.');
  return organization;
}

export async function createPractitionerAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  let practitionerId: string | undefined;
  try {
    const organization = await requireOrganization();
    const input = practitionerCreationSchema.parse({
      displayName: formData.get('displayName'),
      professionalTitle: formData.get('professionalTitle') ?? '',
      status: formData.get('status') ?? 'draft',
      membershipId: formData.get('membershipId') ?? '',
      locationIds: formData.getAll('locationIds'),
      primaryLocationId: formData.get('primaryLocationId') ?? '',
      specialtyIds: formData.getAll('specialtyIds'),
      languageCodes: formData.getAll('languageCodes'),
    });
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_practitioner', {
      p_organization_id: organization.organizationId,
      p_display_name: input.displayName,
      p_professional_title: input.professionalTitle || undefined,
      p_status: input.status,
      p_membership_id: input.membershipId || undefined,
      p_location_ids: input.locationIds,
      p_primary_location_id: input.primaryLocationId || undefined,
      p_specialty_ids: input.specialtyIds,
      p_language_codes: input.languageCodes,
    });
    if (error) throw error;
    practitionerId = data?.[0]?.practitioner_id;
  } catch (error) {
    return { error: safeError(error) };
  }
  if (!practitionerId) return { error: 'The practitioner was not created.' };
  redirect(`/app/practitioners/${practitionerId}`);
}

export async function updatePractitionerAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  try {
    const input = practitionerEditSchema.parse({
      practitionerId: formData.get('practitionerId'),
      displayName: formData.get('displayName'),
      professionalTitle: formData.get('professionalTitle') ?? '',
      registrationJurisdiction: formData.get('registrationJurisdiction') ?? '',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_practitioner_profile', {
      p_practitioner_id: input.practitionerId,
      p_display_name: input.displayName,
      p_professional_title: input.professionalTitle || undefined,
      p_registration_jurisdiction: input.registrationJurisdiction || undefined,
    });
    if (error) throw error;
    revalidatePath('/app/practitioners');
    revalidatePath(`/app/practitioners/${input.practitionerId}`);
    return { success: 'Practitioner profile updated.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function changePractitionerStatusAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  try {
    const input = practitionerStatusActionSchema.parse({
      practitionerId: formData.get('practitionerId'),
      status: formData.get('status'),
      reason: formData.get('reason') ?? '',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('change_practitioner_status', {
      p_practitioner_id: input.practitionerId,
      p_status: input.status,
      p_reason: input.reason || undefined,
    });
    if (error) throw error;
    revalidatePath('/app/practitioners');
    revalidatePath(`/app/practitioners/${input.practitionerId}`);
    return { success: `Practitioner ${input.status}.` };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function linkPractitionerMembershipAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  try {
    const input = practitionerMembershipLinkSchema.parse({
      practitionerId: formData.get('practitionerId'),
      membershipId: formData.get('membershipId'),
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('link_practitioner_membership', {
      p_practitioner_id: input.practitionerId,
      p_membership_id: input.membershipId,
    });
    if (error) throw error;
    revalidatePath(`/app/practitioners/${input.practitionerId}`);
    return { success: 'Membership linked.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function unlinkPractitionerMembershipAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  try {
    const input = practitionerMembershipUnlinkSchema.parse({
      practitionerId: formData.get('practitionerId'),
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('unlink_practitioner_membership', {
      p_practitioner_id: input.practitionerId,
    });
    if (error) throw error;
    revalidatePath(`/app/practitioners/${input.practitionerId}`);
    return { success: 'Membership unlinked.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function updatePractitionerLocationsAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  try {
    const input = locationSelectionSchema.parse({
      practitionerId: formData.get('practitionerId'),
      locationIds: formData.getAll('locationIds'),
      primaryLocationId: formData.get('primaryLocationId') ?? '',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('set_practitioner_locations', {
      p_practitioner_id: input.practitionerId,
      p_location_ids: input.locationIds,
      p_primary_location_id: input.primaryLocationId || undefined,
    });
    if (error) throw error;
    revalidatePath(`/app/practitioners/${input.practitionerId}`);
    return { success: 'Locations updated.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function addPractitionerCredentialAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  try {
    const input = credentialSchema.parse({
      practitionerId: formData.get('practitionerId'),
      credentialType: formData.get('credentialType'),
      issuingBody: formData.get('issuingBody') ?? '',
      registrationNumber: formData.get('registrationNumber') ?? '',
      jurisdiction: formData.get('jurisdiction') ?? '',
      issueDate: formData.get('issueDate') ?? '',
      expiryDate: formData.get('expiryDate') ?? '',
      notes: formData.get('notes') ?? '',
      documentReference: formData.get('documentReference') ?? '',
      isPrimary: formData.get('isPrimary') === 'on',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('add_practitioner_credential', {
      p_practitioner_id: input.practitionerId,
      p_credential_type: input.credentialType,
      p_issuing_body: input.issuingBody || undefined,
      p_registration_number: input.registrationNumber || undefined,
      p_jurisdiction: input.jurisdiction || undefined,
      p_issue_date: input.issueDate || undefined,
      p_expiry_date: input.expiryDate || undefined,
      p_notes: input.notes || undefined,
      p_document_reference: input.documentReference || undefined,
      p_is_primary: input.isPrimary,
    });
    if (error) throw error;
    revalidatePath(`/app/practitioners/${input.practitionerId}`);
    return { success: 'Credential added.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function verifyPractitionerCredentialAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  try {
    const input = credentialVerificationSchema.parse({
      credentialId: formData.get('credentialId'),
      verificationStatus: formData.get('verificationStatus'),
      notes: formData.get('notes') ?? '',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('verify_practitioner_credential', {
      p_credential_id: input.credentialId,
      p_verification_status: input.verificationStatus,
      p_notes: input.notes || undefined,
    });
    if (error) throw error;
    revalidatePath('/app/practitioners');
    return { success: 'Credential verification updated.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function updatePractitionerSpecialtiesAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  try {
    const input = specialtySelectionSchema.parse({
      practitionerId: formData.get('practitionerId'),
      specialtyIds: formData.getAll('specialtyIds'),
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('set_practitioner_specialties', {
      p_practitioner_id: input.practitionerId,
      p_specialty_ids: input.specialtyIds,
    });
    if (error) throw error;
    revalidatePath(`/app/practitioners/${input.practitionerId}`);
    return { success: 'Specialties updated.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function updatePractitionerServicesAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  try {
    const input = serviceSelectionSchema.parse({
      practitionerId: formData.get('practitionerId'),
      serviceIds: formData.getAll('serviceIds'),
      locationId: formData.get('locationId') ?? '',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('set_practitioner_services', {
      p_practitioner_id: input.practitionerId,
      p_service_ids: input.serviceIds,
      p_location_id: input.locationId || undefined,
    });
    if (error) throw error;
    revalidatePath(`/app/practitioners/${input.practitionerId}`);
    return { success: 'Services updated.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function updatePractitionerLanguagesAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  try {
    const input = languageSelectionSchema.parse({
      practitionerId: formData.get('practitionerId'),
      languageCodes: formData.getAll('languageCodes'),
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('set_practitioner_languages', {
      p_practitioner_id: input.practitionerId,
      p_language_codes: input.languageCodes,
    });
    if (error) throw error;
    revalidatePath(`/app/practitioners/${input.practitionerId}`);
    return { success: 'Languages updated.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function updatePractitionerPublicProfileAction(
  formData: FormData,
): Promise<PractitionerActionResult> {
  try {
    const input = publicProfileSchema.parse({
      practitionerId: formData.get('practitionerId'),
      displayName: formData.get('displayName') ?? '',
      professionalTitle: formData.get('professionalTitle') ?? '',
      shortBiography: formData.get('shortBiography') ?? '',
      fullBiography: formData.get('fullBiography') ?? '',
      pronouns: formData.get('pronouns') ?? '',
      profileImageReference: formData.get('profileImageReference') ?? '',
      acceptingNewClients: formData.get('acceptingNewClients') === 'on',
      visibilityStatus: formData.get('visibilityStatus'),
      bookingVisibility: formData.get('bookingVisibility'),
      profileSlug: formData.get('profileSlug') ?? '',
      seoTitle: formData.get('seoTitle') ?? '',
      seoDescription: formData.get('seoDescription') ?? '',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_practitioner_public_profile', {
      p_practitioner_id: input.practitionerId,
      p_display_name: input.displayName || undefined,
      p_professional_title: input.professionalTitle || undefined,
      p_short_biography: input.shortBiography || undefined,
      p_full_biography: input.fullBiography || undefined,
      p_pronouns: input.pronouns || undefined,
      p_profile_image_reference: input.profileImageReference || undefined,
      p_accepting_new_clients: input.acceptingNewClients,
      p_visibility_status: input.visibilityStatus,
      p_booking_visibility: input.bookingVisibility,
      p_profile_slug: input.profileSlug || undefined,
      p_seo_title: input.seoTitle || undefined,
      p_seo_description: input.seoDescription || undefined,
    });
    if (error) throw error;
    revalidatePath(`/app/practitioners/${input.practitionerId}`);
    return { success: 'Public profile readiness updated.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}
