'use server';

import {
  consentSchema,
  emergencyContactSchema,
  patientContactSchema,
  patientCreationSchema,
  patientIdentifierSchema,
  patientStatusActionSchema,
  patientUpdateSchema,
} from '@medbookpro/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export type PatientActionResult = { error?: string; success?: string };

function safeError(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'The patient request could not be completed.';
}

async function requireOrganization() {
  const user = await requireAuthenticatedUser('/app/patients');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) throw new Error('No active organization is available.');
  return organization;
}

function text(formData: FormData, key: string) {
  return formData.get(key) ?? '';
}

export async function createPatientAction(
  formData: FormData,
): Promise<PatientActionResult> {
  try {
    const organization = await requireOrganization();
    const input = patientCreationSchema.parse({
      organizationId: organization.organizationId,
      patientNumber: text(formData, 'patientNumber'),
      firstName: text(formData, 'firstName'),
      middleName: text(formData, 'middleName'),
      lastName: text(formData, 'lastName'),
      preferredName: text(formData, 'preferredName'),
      legalName: text(formData, 'legalName'),
      dateOfBirth: text(formData, 'dateOfBirth'),
      biologicalSex: text(formData, 'biologicalSex'),
      genderIdentity: text(formData, 'genderIdentity'),
      pronouns: text(formData, 'pronouns'),
      maritalStatus: text(formData, 'maritalStatus'),
      occupation: text(formData, 'occupation'),
      preferredLanguage: text(formData, 'preferredLanguage'),
      interpreterRequired: formData.get('interpreterRequired') === 'on',
      accessibilityNotes: text(formData, 'accessibilityNotes'),
      photoReference: text(formData, 'photoReference'),
      nonClinicalNotes: text(formData, 'nonClinicalNotes'),
      status: text(formData, 'status') || 'draft',
      email: text(formData, 'email'),
      phone: text(formData, 'phone'),
    });
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_patient', {
      p_organization_id: organization.organizationId,
      p_patient_number: input.patientNumber || '',
      p_first_name: input.firstName,
      p_middle_name: input.middleName || '',
      p_last_name: input.lastName,
      p_preferred_name: input.preferredName || '',
      p_legal_name: input.legalName || '',
      p_date_of_birth: input.dateOfBirth,
      p_biological_sex: input.biologicalSex,
      p_gender_identity: input.genderIdentity || '',
      p_pronouns: input.pronouns || '',
      p_marital_status: input.maritalStatus,
      p_occupation: input.occupation || '',
      p_preferred_language: input.preferredLanguage,
      p_interpreter_required: input.interpreterRequired,
      p_accessibility_notes: input.accessibilityNotes || '',
      p_photo_reference: input.photoReference || '',
      p_non_clinical_notes: input.nonClinicalNotes || '',
      p_status: input.status,
      p_email: input.email || undefined,
      p_phone: input.phone || undefined,
    });
    if (error) throw error;
    const patientId = data?.[0]?.patient_id;
    if (!patientId) throw new Error('The patient was not created.');
    redirect(`/app/patients/${patientId}`);
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function updatePatientAction(
  formData: FormData,
): Promise<PatientActionResult> {
  try {
    const input = patientUpdateSchema.parse({
      patientId: text(formData, 'patientId'),
      patientNumber: text(formData, 'patientNumber'),
      firstName: text(formData, 'firstName'),
      middleName: text(formData, 'middleName'),
      lastName: text(formData, 'lastName'),
      preferredName: text(formData, 'preferredName'),
      legalName: text(formData, 'legalName'),
      dateOfBirth: text(formData, 'dateOfBirth'),
      biologicalSex: text(formData, 'biologicalSex'),
      genderIdentity: text(formData, 'genderIdentity'),
      pronouns: text(formData, 'pronouns'),
      maritalStatus: text(formData, 'maritalStatus'),
      occupation: text(formData, 'occupation'),
      preferredLanguage: text(formData, 'preferredLanguage'),
      interpreterRequired: formData.get('interpreterRequired') === 'on',
      accessibilityNotes: text(formData, 'accessibilityNotes'),
      photoReference: text(formData, 'photoReference'),
      nonClinicalNotes: text(formData, 'nonClinicalNotes'),
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_patient', {
      p_patient_id: input.patientId,
      p_first_name: input.firstName,
      p_middle_name: input.middleName || '',
      p_last_name: input.lastName,
      p_preferred_name: input.preferredName || '',
      p_legal_name: input.legalName || '',
      p_date_of_birth: input.dateOfBirth,
      p_biological_sex: input.biologicalSex,
      p_gender_identity: input.genderIdentity || '',
      p_pronouns: input.pronouns || '',
      p_marital_status: input.maritalStatus,
      p_occupation: input.occupation || '',
      p_preferred_language: input.preferredLanguage,
      p_interpreter_required: input.interpreterRequired,
      p_accessibility_notes: input.accessibilityNotes || '',
      p_photo_reference: input.photoReference || '',
      p_non_clinical_notes: input.nonClinicalNotes || '',
    });
    if (error) throw error;
    revalidatePath('/app/patients');
    revalidatePath(`/app/patients/${input.patientId}`);
    return { success: 'Patient profile updated.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function changePatientStatusAction(
  formData: FormData,
): Promise<PatientActionResult> {
  try {
    const input = patientStatusActionSchema.parse({
      patientId: text(formData, 'patientId'),
      status: text(formData, 'status'),
      reason: text(formData, 'reason'),
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('change_patient_status', {
      p_patient_id: input.patientId,
      p_status: input.status,
      p_reason: input.reason || undefined,
    });
    if (error) throw error;
    revalidatePath('/app/patients');
    revalidatePath(`/app/patients/${input.patientId}`);
    return { success: `Patient ${input.status}.` };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function updatePatientContactAction(
  formData: FormData,
): Promise<PatientActionResult> {
  try {
    const input = patientContactSchema.parse({
      patientId: text(formData, 'patientId'),
      email: text(formData, 'email'),
      phone: text(formData, 'phone'),
      alternatePhone: text(formData, 'alternatePhone'),
      address: text(formData, 'address'),
      city: text(formData, 'city'),
      province: text(formData, 'province'),
      postalCode: text(formData, 'postalCode'),
      country: text(formData, 'country') || 'Canada',
      emailAllowed: formData.get('emailAllowed') === 'on',
      smsAllowed: formData.get('smsAllowed') === 'on',
      phoneAllowed: formData.get('phoneAllowed') === 'on',
      marketingOptIn: formData.get('marketingOptIn') === 'on',
      reminderPreference: text(formData, 'reminderPreference'),
      preferredContactMethod: text(formData, 'preferredContactMethod'),
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_patient_contact', {
      p_patient_id: input.patientId,
      p_email: input.email || '',
      p_phone: input.phone || '',
      p_alternate_phone: input.alternatePhone || '',
      p_address: input.address || '',
      p_city: input.city || '',
      p_province: input.province || '',
      p_postal_code: input.postalCode || '',
      p_country: input.country,
      p_email_allowed: input.emailAllowed,
      p_sms_allowed: input.smsAllowed,
      p_phone_allowed: input.phoneAllowed,
      p_marketing_opt_in: input.marketingOptIn,
      p_reminder_preference: input.reminderPreference || '',
      p_preferred_contact_method: input.preferredContactMethod,
    });
    if (error) throw error;
    revalidatePath(`/app/patients/${input.patientId}`);
    return { success: 'Contact and communication preferences updated.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function addPatientIdentifierAction(
  formData: FormData,
): Promise<PatientActionResult> {
  try {
    const input = patientIdentifierSchema.parse({
      patientId: text(formData, 'patientId'),
      identifierType: text(formData, 'identifierType'),
      identifierValue: text(formData, 'identifierValue'),
      issuingJurisdiction: text(formData, 'issuingJurisdiction'),
      isPrimary: formData.get('isPrimary') === 'on',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('add_patient_identifier', {
      p_patient_id: input.patientId,
      p_identifier_type: input.identifierType,
      p_identifier_value: input.identifierValue,
      p_issuing_jurisdiction: input.issuingJurisdiction || undefined,
      p_is_primary: input.isPrimary,
    });
    if (error) throw error;
    revalidatePath(`/app/patients/${input.patientId}`);
    return { success: 'Protected identifier added.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function addEmergencyContactAction(
  formData: FormData,
): Promise<PatientActionResult> {
  try {
    const input = emergencyContactSchema.parse({
      patientId: text(formData, 'patientId'),
      name: text(formData, 'name'),
      relationship: text(formData, 'relationship'),
      phone: text(formData, 'phone'),
      alternatePhone: text(formData, 'alternatePhone'),
      email: text(formData, 'email'),
      address: text(formData, 'address'),
      isPrimary: formData.get('isPrimary') === 'on',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('add_patient_emergency_contact', {
      p_patient_id: input.patientId,
      p_name: input.name,
      p_relationship: input.relationship,
      p_phone: input.phone,
      p_alternate_phone: input.alternatePhone || undefined,
      p_email: input.email || undefined,
      p_address: input.address || undefined,
      p_is_primary: input.isPrimary,
    });
    if (error) throw error;
    revalidatePath(`/app/patients/${input.patientId}`);
    return { success: 'Emergency contact added.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function updatePatientConsentAction(
  formData: FormData,
): Promise<PatientActionResult> {
  try {
    const input = consentSchema.parse({
      patientId: text(formData, 'patientId'),
      consentType: text(formData, 'consentType'),
      consentDate: text(formData, 'consentDate'),
      version: text(formData, 'version'),
      documentReference: text(formData, 'documentReference'),
      withdrawn: formData.get('withdrawn') === 'on',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_patient_consents', {
      p_patient_id: input.patientId,
      p_consents: [
        {
          consentType: input.consentType,
          consentDate: input.consentDate,
          version: input.version,
          documentReference: input.documentReference || '',
          withdrawn: input.withdrawn,
        },
      ],
    });
    if (error) throw error;
    revalidatePath(`/app/patients/${input.patientId}`);
    return { success: 'Consent record updated.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}
