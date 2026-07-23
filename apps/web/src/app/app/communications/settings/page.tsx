import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { saveSettingsAction } from '../actions';

export default async function CommunicationSettingsPage() {
  const user = await requireAuthenticatedUser('/app/communications/settings'); const org = await getActiveOrganizationContext(user.id); if (!org) return null; const supabase = await createClient(); const { data } = await supabase.from('organization_notification_settings').select('default_reminder_minutes, default_sender, timezone').maybeSingle();
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-3xl"><h1 className="text-4xl font-semibold tracking-tight">Notification settings</h1><p className="mt-3 text-slate-600">Organization defaults only. Provider and branding integrations are future work.</p><Card className="mt-8"><form action={saveSettingsAction} className="space-y-4"><label className="block text-sm">Default reminder minutes<input required type="number" min="0" name="defaultReminderMinutes" defaultValue={data?.default_reminder_minutes ?? 1440} className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm">Default sender placeholder<input type="email" name="defaultSender" defaultValue={data?.default_sender ?? ''} className="mt-1 w-full rounded border p-2" /></label><label className="block text-sm">Timezone<input required name="timezone" defaultValue={data?.timezone ?? 'America/Edmonton'} className="mt-1 w-full rounded border p-2" /></label><button className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" type="submit">Save settings</button></form></Card></div></main>;
}
