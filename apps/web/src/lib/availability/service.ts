import 'server-only';

import type { Database } from '@medbookpro/database';
import { createClient } from '@/lib/supabase/server';

export type AvailabilityPreview = {
  date: string;
  startTime: string;
  endTime: string;
  mode: string;
  locationId: string | null;
  serviceId: string | null;
  timezone: string;
  source: string;
};

function previewRows(value: unknown): AvailabilityPreview[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (row): row is AvailabilityPreview =>
      typeof row === 'object' &&
      row !== null &&
      typeof (row as AvailabilityPreview).date === 'string' &&
      typeof (row as AvailabilityPreview).startTime === 'string' &&
      typeof (row as AvailabilityPreview).endTime === 'string',
  );
}

export async function previewPractitionerAvailability(input: {
  practitionerId: string;
  startDate: string;
  endDate: string;
  locationId?: string;
  serviceId?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    'preview_practitioner_availability',
    {
      p_practitioner_id: input.practitionerId,
      p_start_date: input.startDate,
      p_end_date: input.endDate,
      p_location_id: input.locationId || undefined,
      p_service_id: input.serviceId || undefined,
    },
  );
  if (error) throw error;
  return previewRows(data);
}

export async function createAvailabilitySchedule(input: {
  organizationId: string;
  practitionerId: string;
  name: string;
  timezone: string;
  blocks: Database['public']['Functions']['create_practitioner_availability_schedule']['Args']['p_blocks'];
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    'create_practitioner_availability_schedule',
    {
      p_organization_id: input.organizationId,
      p_practitioner_id: input.practitionerId,
      p_name: input.name,
      p_timezone: input.timezone,
      p_blocks: input.blocks,
    },
  );
  if (error) throw error;
  return data;
}
