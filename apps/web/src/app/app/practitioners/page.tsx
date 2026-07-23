import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export default async function PractitionersPage() {
  const user = await requireAuthenticatedUser('/app/practitioners');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('practitioners')
    .select(
      'id, display_name, professional_title, status, linked_membership_id',
    )
    .eq('organization_id', organization.organizationId)
    .order('display_name');
  const practitioners = (data ?? []) as Array<{
    id: string;
    display_name: string;
    professional_title: string | null;
    status: string;
    linked_membership_id: string | null;
  }>;
  if (error)
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <Card>
          <p role="alert">Practitioners are temporarily unavailable.</p>
        </Card>
      </main>
    );
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
              Practitioners
            </p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              Practitioner foundation
            </h1>
            <p className="mt-3 text-slate-600">
              Manage professional profiles without conflating them with staff
              membership.
            </p>
          </div>
          <Link
            href="/app/practitioners/new"
            className="rounded bg-blue-700 px-4 py-2 font-medium text-white"
          >
            Add practitioner
          </Link>
        </div>
        <Card className="mt-8">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <caption className="sr-only">
                Practitioners in {organization.organizationName}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Title</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Account linkage</th>
                  <th className="px-3 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {practitioners.map((practitioner) => (
                  <tr
                    key={practitioner.id}
                    className="border-b border-slate-100"
                  >
                    <td className="px-3 py-4 font-medium">
                      {practitioner.display_name}
                    </td>
                    <td className="px-3 py-4">
                      {practitioner.professional_title ?? '—'}
                    </td>
                    <td className="px-3 py-4">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium">
                        {practitioner.status}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      {practitioner.linked_membership_id
                        ? 'Linked membership'
                        : 'No linked account'}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <Link
                        className="font-medium text-blue-700 hover:underline"
                        href={`/app/practitioners/${practitioner.id}`}
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {practitioners.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-600">
              No practitioners yet. Create the first professional profile to
              begin.
            </p>
          )}
        </Card>
      </div>
    </main>
  );
}
