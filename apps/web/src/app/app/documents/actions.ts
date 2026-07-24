'use server';

import { revalidatePath } from 'next/cache';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { getSafeActionError } from '@/lib/action-errors';

export type DocumentActionResult = { error?: string; success?: string };

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}
async function organization() {
  const user = await requireAuthenticatedUser('/app/documents');
  const context = await getActiveOrganizationContext(user.id);
  if (!context) throw new Error('No active organization is available.');
  return context;
}

export async function createDocumentMetadataAction(
  _previousState: DocumentActionResult,
  formData: FormData,
): Promise<DocumentActionResult> {
  try {
    const context = await organization();
    const supabase = await createClient();
    const { error } = await supabase.rpc('create_document_metadata', {
      p_organization_id: context.organizationId,
      p_title: value(formData, 'title'),
      p_description: value(formData, 'description'),
      p_category_key: value(formData, 'categoryKey'),
      p_patient_id: value(formData, 'patientId') || undefined,
      p_encounter_id: value(formData, 'encounterId') || undefined,
      p_location_id: value(formData, 'locationId') || undefined,
      p_practitioner_id: value(formData, 'practitionerId') || undefined,
      p_mime_type: value(formData, 'mimeType') || undefined,
      p_file_size_bytes:
        Number(value(formData, 'fileSizeBytes') || 0) || undefined,
      p_checksum_placeholder: value(formData, 'checksum') || undefined,
      p_storage_provider_placeholder: undefined,
      p_storage_path_placeholder: undefined,
    });
    if (error) throw error;
    revalidatePath('/app/documents');
    return { success: 'Document metadata created.' };
  } catch (error) {
    return {
      error: getSafeActionError(
        error,
        'document.create.failed',
        'The document metadata could not be created.',
      ),
    };
  }
}

export async function archiveDocumentAction(formData: FormData): Promise<void> {
  await organization();
  const supabase = await createClient();
  const { error } = await supabase.rpc('archive_document', {
    p_document_id: value(formData, 'documentId'),
    p_reason: value(formData, 'reason') || undefined,
  });
  if (error) throw error;
  revalidatePath('/app/documents');
}
export async function restoreDocumentAction(formData: FormData): Promise<void> {
  await organization();
  const supabase = await createClient();
  const { error } = await supabase.rpc('restore_document', {
    p_document_id: value(formData, 'documentId'),
  });
  if (error) throw error;
  revalidatePath('/app/documents');
}
export async function updateRetentionAction(formData: FormData): Promise<void> {
  await organization();
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_document_retention', {
    p_document_id: value(formData, 'documentId'),
    p_retention_status: value(formData, 'retentionStatus'),
    p_scheduled_deletion_at:
      value(formData, 'scheduledDeletionAt') || (null as unknown as string),
    p_legal_hold: formData.get('legalHold') === 'on',
  });
  if (error) throw error;
  revalidatePath('/app/documents/settings');
}
