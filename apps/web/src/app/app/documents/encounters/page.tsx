import { Card } from '@medbookpro/ui';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export default async function EncounterDocumentsPage() { const user = await requireAuthenticatedUser('/app/documents/encounters'); const context = await getActiveOrganizationContext(user.id); if (!context) return null; const supabase = await createClient(); const { data, error } = await supabase.from('encounters').select('id,encounter_type,status,started_at').eq('organization_id', context.organizationId).order('started_at', { ascending: false }); if (error) throw error; return <main className="min-h-screen bg-slate-50 px-6 py-12"><div className="mx-auto max-w-4xl"><h1 className="text-4xl font-semibold">Encounter attachments</h1><div className="mt-8 space-y-4">{data?.map((encounter) => <Card key={encounter.id}><p className="font-semibold">{encounter.encounter_type}</p><p className="text-sm text-slate-600">{encounter.status} · {encounter.started_at ?? 'Not started'}</p></Card>)}</div></div></main>; }
