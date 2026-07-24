'use server';

import {
  carePlanSchema,
  clinicalFormSchema,
  encounterCreateSchema,
  encounterStatusUpdateSchema,
  encounterUpdateSchema,
  soapNoteSchema,
} from '@medbookpro/shared';
import type { Json } from '@medbookpro/database';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { getSafeActionError } from '@/lib/action-errors';

export type ClinicalActionResult = { error?: string; success?: string };

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function safeError(error: unknown) {
  return getSafeActionError(
    error,
    'clinical.mutation.failed',
    'The clinical request could not be completed.',
  );
}

async function clinicalOrganization(path = '/app/clinical') {
  const user = await requireAuthenticatedUser(path);
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  return organization;
}

export async function createEncounterAction(
  _previousState: ClinicalActionResult,
  formData: FormData,
): Promise<ClinicalActionResult> {
  let encounterId: string | undefined;
  try {
    const organization = await clinicalOrganization('/app/clinical/new');
    const input = encounterCreateSchema.parse({
      patientId: value(formData, 'patientId'),
      practitionerId: value(formData, 'practitionerId'),
      appointmentId: value(formData, 'appointmentId') || undefined,
      encounterType: value(formData, 'encounterType'),
      status: value(formData, 'status') || 'draft',
    });
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_encounter', {
      p_organization_id: organization.organizationId,
      p_patient_id: input.patientId,
      p_practitioner_id: input.practitionerId,
      p_appointment_id: input.appointmentId,
      p_encounter_type: input.encounterType,
      p_status: input.status,
    });
    if (error) throw error;
    encounterId = data?.[0]?.encounter_id;
    if (!encounterId) throw new Error('The encounter was not created.');
    revalidatePath('/app/clinical');
  } catch (error) {
    return { error: safeError(error) };
  }
  redirect(`/app/clinical/${encounterId}`);
}

export async function updateEncounterAction(formData: FormData) {
  try {
    await clinicalOrganization();
    const input = encounterUpdateSchema.parse({
      encounterId: value(formData, 'encounterId'),
      encounterType: value(formData, 'encounterType'),
      startedAt: value(formData, 'startedAt') || undefined,
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_encounter', {
      p_encounter_id: input.encounterId,
      p_encounter_type: input.encounterType,
      p_started_at: input.startedAt,
    });
    if (error) throw error;
    revalidatePath(`/app/clinical/${input.encounterId}`);
  } catch (error) {
    throw new Error(safeError(error));
  }
}

export async function changeEncounterStatusAction(formData: FormData) {
  try {
    await clinicalOrganization();
    const input = encounterStatusUpdateSchema.parse({
      encounterId: value(formData, 'encounterId'),
      status: value(formData, 'status'),
      reason: value(formData, 'reason') || undefined,
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('change_encounter_status', {
      p_encounter_id: input.encounterId,
      p_to_status: input.status,
      p_reason: input.reason,
    });
    if (error) throw error;
    revalidatePath('/app/clinical');
    revalidatePath(`/app/clinical/${input.encounterId}`);
  } catch (error) {
    throw new Error(safeError(error));
  }
}

export async function updateSoapAction(
  _previousState: ClinicalActionResult,
  formData: FormData,
): Promise<ClinicalActionResult> {
  try {
    await clinicalOrganization();
    const input = soapNoteSchema.parse({
      encounterId: value(formData, 'encounterId'),
      subjective: value(formData, 'subjective'),
      objective: value(formData, 'objective'),
      assessment: value(formData, 'assessment'),
      plan: value(formData, 'plan'),
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_soap_note', {
      p_encounter_id: input.encounterId,
      p_subjective: input.subjective,
      p_objective: input.objective,
      p_assessment: input.assessment,
      p_plan: input.plan,
    });
    if (error) throw error;
    revalidatePath(`/app/clinical/${input.encounterId}`);
    return { success: 'SOAP note saved.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function updateCarePlanAction(formData: FormData) {
  try {
    await clinicalOrganization();
    const input = carePlanSchema.parse({
      carePlanId: value(formData, 'carePlanId') || undefined,
      encounterId: value(formData, 'encounterId'),
      goals: value(formData, 'goals'),
      interventions: value(formData, 'interventions'),
      followUpNotes: value(formData, 'followUpNotes'),
      status: value(formData, 'status'),
      reviewDate: value(formData, 'reviewDate') || undefined,
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_care_plan', {
      p_care_plan_id: input.carePlanId ?? (null as unknown as string),
      p_encounter_id: input.encounterId,
      p_goals: input.goals,
      p_interventions: input.interventions,
      p_follow_up_notes: input.followUpNotes,
      p_status: input.status,
      p_review_date: input.reviewDate ?? (null as unknown as string),
    });
    if (error) throw error;
    revalidatePath(`/app/clinical/${input.encounterId}`);
  } catch (error) {
    throw new Error(safeError(error));
  }
}

export async function updateFormAction(formData: FormData) {
  try {
    await clinicalOrganization();
    const response = JSON.parse(value(formData, 'structuredResponse') || '{}');
    const input = clinicalFormSchema.parse({
      formId: value(formData, 'formId') || undefined,
      encounterId: value(formData, 'encounterId'),
      formType: value(formData, 'formType'),
      title: value(formData, 'title'),
      version: value(formData, 'version'),
      completionStatus: value(formData, 'completionStatus'),
      structuredResponse: response,
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_forms', {
      p_form_id: input.formId ?? (null as unknown as string),
      p_encounter_id: input.encounterId,
      p_form_type: input.formType,
      p_title: input.title,
      p_version: input.version,
      p_completion_status: input.completionStatus,
      p_structured_response: input.structuredResponse as Json,
    });
    if (error) throw error;
    revalidatePath(`/app/clinical/${input.encounterId}`);
  } catch (error) {
    throw new Error(safeError(error));
  }
}
