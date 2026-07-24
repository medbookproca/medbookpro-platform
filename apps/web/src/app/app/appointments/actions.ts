'use server';

import {
  appointmentCreateSchema,
  appointmentStatusUpdateSchema,
  appointmentUpdateSchema,
} from '@medbookpro/shared';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { getSafeActionError } from '@/lib/action-errors';

export type AppointmentActionResult = { error?: string };

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function safeError(error: unknown) {
  return getSafeActionError(
    error,
    'appointment.mutation.failed',
    'The appointment request could not be completed.',
  );
}

async function appointmentOrganization() {
  const user = await requireAuthenticatedUser('/app/appointments');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  return organization;
}

function parseScheduledStart(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

function parseInput(formData: FormData) {
  return appointmentCreateSchema.parse({
    patientId: value(formData, 'patientId'),
    practitionerId: value(formData, 'practitionerId'),
    locationId: value(formData, 'locationId'),
    serviceId: value(formData, 'serviceId'),
    appointmentType: value(formData, 'appointmentType'),
    scheduledStart: parseScheduledStart(value(formData, 'scheduledStart')),
    durationMinutes: Number(value(formData, 'durationMinutes')),
    timezone: value(formData, 'timezone'),
    preBufferMinutes: Number(value(formData, 'preBufferMinutes') || 0),
    postBufferMinutes: Number(value(formData, 'postBufferMinutes') || 0),
    status: value(formData, 'status') || 'scheduled',
    notes: value(formData, 'notes') || undefined,
  });
}

export async function createAppointmentAction(
  _previousState: AppointmentActionResult,
  formData: FormData,
): Promise<AppointmentActionResult> {
  let appointmentId: string | undefined;
  try {
    const organization = await appointmentOrganization();
    const input = parseInput(formData);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('create_appointment', {
      p_organization_id: organization.organizationId,
      p_patient_id: input.patientId,
      p_practitioner_id: input.practitionerId,
      p_location_id: input.locationId,
      p_service_id: input.serviceId,
      p_appointment_type: input.appointmentType,
      p_scheduled_start: input.scheduledStart,
      p_duration_minutes: input.durationMinutes,
      p_timezone: input.timezone,
      p_pre_buffer_minutes: input.preBufferMinutes,
      p_post_buffer_minutes: input.postBufferMinutes,
      p_status: input.status,
      p_notes: input.notes,
    });
    if (error) throw error;
    appointmentId = data?.[0]?.appointment_id;
    if (!appointmentId) throw new Error('The appointment was not created.');
    revalidatePath('/app/appointments');
  } catch (error) {
    return { error: safeError(error) };
  }
  redirect(`/app/appointments/${appointmentId}`);
}

export async function updateAppointmentAction(
  _previousState: AppointmentActionResult,
  formData: FormData,
): Promise<AppointmentActionResult> {
  let appointmentId: string | undefined;
  try {
    const organization = await appointmentOrganization();
    const input = appointmentUpdateSchema.parse({
      ...parseInput(formData),
    });
    appointmentId = value(formData, 'appointmentId');
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_appointment', {
      p_appointment_id: appointmentId,
      p_scheduled_start: input.scheduledStart,
      p_duration_minutes: input.durationMinutes,
      p_timezone: input.timezone,
      p_location_id: input.locationId,
      p_service_id: input.serviceId,
      p_appointment_type: input.appointmentType,
      p_pre_buffer_minutes: input.preBufferMinutes,
      p_post_buffer_minutes: input.postBufferMinutes,
      p_notes: input.notes,
    });
    if (error) throw error;
    revalidatePath('/app/appointments');
    revalidatePath(`/app/appointments/${appointmentId}`);
  } catch (error) {
    return { error: safeError(error) };
  }
  redirect(`/app/appointments/${appointmentId}`);
}

export async function changeAppointmentStatusAction(formData: FormData) {
  let appointmentId: string | undefined;
  try {
    const organization = await appointmentOrganization();
    const input = appointmentStatusUpdateSchema.parse({
      appointmentId: value(formData, 'appointmentId'),
      status: value(formData, 'status'),
      reason: value(formData, 'reason') || undefined,
    });
    appointmentId = input.appointmentId;
    const supabase = await createClient();
    const { error } = await supabase.rpc('change_appointment_status', {
      p_appointment_id: input.appointmentId,
      p_to_status: input.status,
      p_reason: input.reason,
    });
    if (error) throw error;
    void organization;
    revalidatePath('/app/appointments');
    revalidatePath(`/app/appointments/${input.appointmentId}`);
  } catch (error) {
    throw new Error(safeError(error));
  }
  redirect(`/app/appointments/${appointmentId}`);
}
