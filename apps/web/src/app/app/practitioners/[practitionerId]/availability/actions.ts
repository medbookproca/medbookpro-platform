'use server';

import {
  availabilityOverrideSchema,
  previewAvailabilitySchema,
  scheduleTemplateSchema,
  timeOffSchema,
} from '@medbookpro/shared';
import { revalidatePath } from 'next/cache';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { previewPractitionerAvailability } from '@/lib/availability/service';

export type AvailabilityActionResult = {
  error?: string;
  success?: string;
  preview?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    mode: string;
    timezone: string;
    source: string;
  }>;
};

function safeError(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'The availability request could not be completed.';
}

async function requireAvailabilityOrganization(practitionerId: string) {
  const user = await requireAuthenticatedUser(
    `/app/practitioners/${practitionerId}/availability`,
  );
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) throw new Error('No active organization is available.');
  return organization;
}

export async function createAvailabilityScheduleAction(
  formData: FormData,
): Promise<AvailabilityActionResult> {
  const practitionerId = String(formData.get('practitionerId'));
  try {
    const organization = await requireAvailabilityOrganization(practitionerId);
    const input = scheduleTemplateSchema.parse({
      practitionerId,
      name: formData.get('name'),
      timezone: formData.get('timezone'),
      effectiveFrom: formData.get('effectiveFrom') ?? '',
      effectiveTo: formData.get('effectiveTo') ?? '',
      blocks: [
        {
          weekday: Number(formData.get('weekday')),
          startTime: formData.get('startTime'),
          endTime: formData.get('endTime'),
          mode: formData.get('mode'),
          locationId: formData.get('locationId') ?? '',
          serviceId: formData.get('serviceId') ?? '',
          capacityHint: Number(formData.get('capacityHint') ?? 1),
        },
      ],
      breaks: [],
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc(
      'create_practitioner_availability_schedule',
      {
        p_organization_id: organization.organizationId,
        p_practitioner_id: input.practitionerId,
        p_name: input.name,
        p_timezone: input.timezone,
        p_blocks: input.blocks,
      },
    );
    if (error) throw error;
    revalidatePath(`/app/practitioners/${practitionerId}/availability`);
    return { success: 'Recurring schedule created.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function addAvailabilityOverrideAction(
  formData: FormData,
): Promise<AvailabilityActionResult> {
  const practitionerId = String(formData.get('practitionerId'));
  try {
    const organization = await requireAvailabilityOrganization(practitionerId);
    const input = availabilityOverrideSchema.parse({
      practitionerId,
      overrideDate: formData.get('overrideDate'),
      kind: formData.get('kind'),
      startTime: formData.get('startTime') ?? '',
      endTime: formData.get('endTime') ?? '',
      mode: formData.get('mode') ?? 'mixed',
      locationId: formData.get('locationId') ?? '',
      serviceId: formData.get('serviceId') ?? '',
      reason: formData.get('reason') ?? '',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('add_practitioner_schedule_override', {
      p_organization_id: organization.organizationId,
      p_practitioner_id: input.practitionerId,
      p_override_date: input.overrideDate,
      p_kind: input.kind,
      p_start_time: input.startTime || undefined,
      p_end_time: input.endTime || undefined,
      p_mode: input.mode,
      p_location_id: input.locationId || undefined,
      p_service_id: input.serviceId || undefined,
      p_reason: input.reason || undefined,
    });
    if (error) throw error;
    revalidatePath(`/app/practitioners/${practitionerId}/availability`);
    return { success: 'Schedule override added.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function createTimeOffAction(
  formData: FormData,
): Promise<AvailabilityActionResult> {
  const practitionerId = String(formData.get('practitionerId'));
  try {
    const organization = await requireAvailabilityOrganization(practitionerId);
    const input = timeOffSchema.parse({
      practitionerId,
      category: formData.get('category'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      allDay: true,
      reason: formData.get('reason') ?? '',
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('create_practitioner_time_off', {
      p_organization_id: organization.organizationId,
      p_practitioner_id: input.practitionerId,
      p_category: input.category,
      p_start_date: input.startDate,
      p_end_date: input.endDate,
      p_reason: input.reason || undefined,
    });
    if (error) throw error;
    revalidatePath(`/app/practitioners/${practitionerId}/availability`);
    return { success: 'Time off created.' };
  } catch (error) {
    return { error: safeError(error) };
  }
}

export async function previewAvailabilityAction(
  formData: FormData,
): Promise<AvailabilityActionResult> {
  const practitionerId = String(formData.get('practitionerId'));
  try {
    await requireAvailabilityOrganization(practitionerId);
    const input = previewAvailabilitySchema.parse({
      practitionerId,
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      locationId: formData.get('locationId') ?? '',
      serviceId: formData.get('serviceId') ?? '',
    });
    const preview = await previewPractitionerAvailability(input);
    return {
      success: `${preview.length} availability interval${preview.length === 1 ? '' : 's'} found.`,
      preview,
    };
  } catch (error) {
    return { error: safeError(error) };
  }
}
