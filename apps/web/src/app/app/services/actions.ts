'use server';

import {
  serviceArchiveSchema,
  serviceCreationSchema,
  serviceUpdateSchema,
} from '@medbookpro/shared';
import { revalidatePath } from 'next/cache';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { getSafeActionError } from '@/lib/action-errors';

export type ServiceActionResult = { error?: string; success?: string };

async function requireOrganization() {
  const user = await requireAuthenticatedUser('/app/services');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) throw new Error('No active organization is available.');
  return organization;
}

function result(error: unknown, fallback: string): ServiceActionResult {
  return {
    error: getSafeActionError(error, 'service.mutation.failed', fallback),
  };
}

export async function createServiceAction(
  formData: FormData,
): Promise<ServiceActionResult> {
  try {
    const organization = await requireOrganization();
    const input = serviceCreationSchema.parse({
      name: formData.get('name'),
      description: formData.get('description') ?? '',
      displayOrder: Number(formData.get('displayOrder') ?? 0),
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('create_service', {
      p_organization_id: organization.organizationId,
      p_name: input.name,
      p_description: input.description || undefined,
      p_display_order: input.displayOrder,
    });
    if (error) throw error;
    revalidatePath('/app/services');
    revalidatePath('/app/appointments/new');
    return { success: 'Service created.' };
  } catch (error) {
    return result(
      error,
      'The service could not be created. Review the information and try again.',
    );
  }
}

export async function updateServiceAction(
  formData: FormData,
): Promise<ServiceActionResult> {
  try {
    const organization = await requireOrganization();
    const input = serviceUpdateSchema.parse({
      serviceId: formData.get('serviceId'),
      name: formData.get('name'),
      description: formData.get('description') ?? '',
      displayOrder: Number(formData.get('displayOrder') ?? 0),
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('update_service', {
      p_service_id: input.serviceId,
      p_name: input.name,
      p_description: input.description || undefined,
      p_display_order: input.displayOrder,
    });
    if (error) throw error;
    void organization;
    revalidatePath('/app/services');
    revalidatePath('/app/appointments/new');
    return { success: 'Service updated.' };
  } catch (error) {
    return result(
      error,
      'The service could not be updated. Review the information and try again.',
    );
  }
}

export async function archiveServiceAction(
  formData: FormData,
): Promise<ServiceActionResult> {
  try {
    await requireOrganization();
    const input = serviceArchiveSchema.parse({
      serviceId: formData.get('serviceId'),
    });
    const supabase = await createClient();
    const { error } = await supabase.rpc('archive_service', {
      p_service_id: input.serviceId,
    });
    if (error) throw error;
    revalidatePath('/app/services');
    revalidatePath('/app/appointments/new');
    return { success: 'Service archived.' };
  } catch (error) {
    return result(
      error,
      'The service could not be archived. Please try again.',
    );
  }
}
