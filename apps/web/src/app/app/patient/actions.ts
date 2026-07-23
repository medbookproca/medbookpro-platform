'use server';

import { revalidatePath } from 'next/cache';
import { requirePatientPortalAccount } from '@/lib/patient-portal';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

export async function patientProfileAction(formData: FormData): Promise<void> {
  await requirePatientPortalAccount('/app/patient/profile');
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_patient_profile', {
    p_preferred_name: value(formData, 'preferredName') || '',
    p_preferred_language: value(formData, 'preferredLanguage') || 'en-CA',
    p_email: value(formData, 'email') || '',
    p_phone: value(formData, 'phone') || '',
  });
  if (error) throw error;
  revalidatePath('/app/patient/profile');
}

export async function patientPreferencesAction(formData: FormData): Promise<void> {
  await requirePatientPortalAccount('/app/patient/preferences');
  const supabase = await createClient();
  const { error } = await supabase.rpc('patient_update_preferences', {
    p_appointment_reminders: formData.get('appointmentReminders') === 'on',
    p_marketing_opt_in: formData.get('marketingOptIn') === 'on',
    p_sms_enabled: formData.get('smsEnabled') === 'on',
    p_email_enabled: formData.get('emailEnabled') === 'on',
    p_preferred_language: value(formData, 'preferredLanguage') || 'en-CA',
    p_quiet_hours: {},
  });
  if (error) throw error;
  revalidatePath('/app/patient/preferences');
}

export async function patientConsentAction(formData: FormData): Promise<void> {
  await requirePatientPortalAccount('/app/patient/consents');
  const supabase = await createClient();
  const { error } = await supabase.rpc('accept_consent', {
    p_consent_type: value(formData, 'consentType'),
    p_version: value(formData, 'version'),
    p_consent_date: value(formData, 'consentDate'),
    p_document_reference: value(formData, 'documentReference') || undefined,
  });
  if (error) throw error;
  revalidatePath('/app/patient/consents');
}

export async function cancelRequestAction(formData: FormData): Promise<void> {
  await requirePatientPortalAccount('/app/patient/appointments');
  const supabase = await createClient();
  const { error } = await supabase.rpc('cancel_request', {
    p_appointment_id: value(formData, 'appointmentId'),
    p_reason: value(formData, 'reason') || undefined,
  });
  if (error) throw error;
  revalidatePath('/app/patient/appointments');
}
