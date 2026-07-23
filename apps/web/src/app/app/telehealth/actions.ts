'use server';

import { revalidatePath } from 'next/cache';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim(); }
async function organization() { const user = await requireAuthenticatedUser('/app/telehealth'); const context = await getActiveOrganizationContext(user.id); if (!context) throw new Error('No active organization is available.'); return context; }

export async function createTelehealthSessionAction(formData: FormData): Promise<void> { const context = await organization(); const supabase = await createClient(); const { error } = await supabase.rpc('create_telehealth_session', { p_organization_id: context.organizationId, p_location_id: value(formData, 'locationId') || null as unknown as string, p_appointment_id: value(formData, 'appointmentId'), p_patient_id: value(formData, 'patientId'), p_practitioner_id: value(formData, 'practitionerId'), p_scheduled_start: value(formData, 'scheduledStart'), p_scheduled_end: value(formData, 'scheduledEnd'), p_provider_placeholder: value(formData, 'provider') || 'custom_provider' }); if (error) throw error; revalidatePath('/app/telehealth'); }
export async function joinWaitingRoomAction(formData: FormData): Promise<void> { await organization(); const supabase = await createClient(); const { error } = await supabase.rpc('join_waiting_room', { p_session_id: value(formData, 'sessionId') }); if (error) throw error; revalidatePath('/app/telehealth/waiting-room'); }
export async function admitPatientAction(formData: FormData): Promise<void> { await organization(); const supabase = await createClient(); const { error } = await supabase.rpc('admit_patient', { p_session_id: value(formData, 'sessionId') }); if (error) throw error; revalidatePath('/app/telehealth/waiting-room'); }
export async function startSessionAction(formData: FormData): Promise<void> { await organization(); const supabase = await createClient(); const { error } = await supabase.rpc('start_session', { p_session_id: value(formData, 'sessionId') }); if (error) throw error; revalidatePath('/app/telehealth'); }
export async function endSessionAction(formData: FormData): Promise<void> { await organization(); const supabase = await createClient(); const { error } = await supabase.rpc('end_session', { p_session_id: value(formData, 'sessionId') }); if (error) throw error; revalidatePath('/app/telehealth'); }
export async function cancelSessionAction(formData: FormData): Promise<void> { await organization(); const supabase = await createClient(); const { error } = await supabase.rpc('cancel_session', { p_session_id: value(formData, 'sessionId'), p_reason: value(formData, 'reason') || undefined }); if (error) throw error; revalidatePath('/app/telehealth'); }
export async function updateProviderSettingsAction(formData: FormData): Promise<void> { await organization(); const supabase = await createClient(); const { error } = await supabase.rpc('update_telehealth_provider_settings', { p_provider: value(formData, 'provider'), p_display_name: value(formData, 'displayName'), p_enabled: formData.get('enabled') === 'on' }); if (error) throw error; revalidatePath('/app/telehealth/settings'); }
