'use server';

import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, key: string) { return String(formData.get(key) ?? '').trim(); }
export async function requestReportExportAction(formData: FormData): Promise<void> { const user = await requireAuthenticatedUser('/app/reports'); const org = await getActiveOrganizationContext(user.id); if (!org) throw new Error('No active organization is available.'); const supabase = await createClient(); const { error } = await supabase.rpc('request_report_export', { p_organization_id: org.organizationId, p_report_key: value(formData, 'reportKey'), p_format: value(formData, 'format'), p_filters: {} }); if (error) throw error; }
