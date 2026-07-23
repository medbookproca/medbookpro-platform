'use server';

import { revalidatePath } from 'next/cache';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}
async function organization() {
  const user = await requireAuthenticatedUser('/app/ai');
  const context = await getActiveOrganizationContext(user.id);
  if (!context) throw new Error('No active organization is available.');
  return context;
}

export async function createPromptAction(formData: FormData) {
  await organization();
  const supabase = await createClient();
  const { error } = await supabase.rpc('create_prompt', {
    p_name: value(formData, 'name'),
    p_category: value(formData, 'category'),
    p_system_prompt: value(formData, 'systemPrompt'),
    p_user_template: value(formData, 'userTemplate'),
    p_variables: {},
  });
  if (error) throw error;
  revalidatePath('/app/ai/prompts');
}
export async function publishPromptAction(formData: FormData) {
  await organization();
  const supabase = await createClient();
  const { error } = await supabase.rpc('publish_prompt', {
    p_prompt_id: value(formData, 'promptId'),
    p_version_id: value(formData, 'versionId'),
  });
  if (error) throw error;
  revalidatePath('/app/ai/prompts');
}
export async function createAiRequestAction(formData: FormData) {
  await organization();
  const supabase = await createClient();
  const { error } = await supabase.rpc('create_ai_request', {
    p_patient_id: value(formData, 'patientId') || (null as unknown as string),
    p_encounter_id:
      value(formData, 'encounterId') || (null as unknown as string),
    p_prompt_version_id: value(formData, 'promptVersionId'),
    p_request_type: value(formData, 'requestType'),
    p_provider_key: undefined,
    p_model_key: undefined,
  });
  if (error) throw error;
  revalidatePath('/app/ai/requests');
}
export async function updateAiProviderSettingsAction(formData: FormData) {
  await organization();
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_ai_provider_settings', {
    p_provider_key: value(formData, 'providerKey'),
    p_enabled: formData.get('enabled') === 'on',
  });
  if (error) throw error;
  revalidatePath('/app/ai/settings');
}
