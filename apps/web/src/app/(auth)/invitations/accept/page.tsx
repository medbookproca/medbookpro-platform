import Link from 'next/link';
import { Card } from '@medbookpro/ui';
import { acceptStaffInvitationFormAction } from '@/app/app/settings/staff/actions';
import { getCurrentUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

interface InvitationPreview {
  organization_name: string;
  invited_email: string;
  expires_at: string;
  role_names: string[];
  access_mode: string;
}

export default async function AcceptInvitationPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data } = token && user ? await supabase.rpc('get_staff_invitation_preview', { p_token: token }) : { data: null };
  const preview = (Array.isArray(data) ? data[0] : data) as InvitationPreview | null;
  const invalid = !token || !user || !preview;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-950">
      <div className="mx-auto max-w-lg">
        <Card>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">MedBookPro</p>
          <h1 className="mt-3 text-3xl font-semibold">Accept staff invitation</h1>
          {invalid ? (
            <div className="mt-6 space-y-4" role="alert">
              <p className="text-slate-700">This invitation is missing, expired, revoked, or not available for the signed-in account.</p>
              {!user && <Link className="inline-block rounded bg-blue-700 px-4 py-2 font-medium text-white" href={`/sign-in?next=${encodeURIComponent(token ? `/invitations/accept?token=${token}` : '/invitations/accept')}`}>Sign in to continue</Link>}
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              <div className="rounded-lg bg-blue-50 p-4 text-sm"><p><strong>Organization:</strong> {preview.organization_name}</p><p><strong>Invited email:</strong> {preview.invited_email}</p><p><strong>Roles:</strong> {preview.role_names.join(', ')}</p><p><strong>Location access:</strong> {preview.access_mode === 'all' ? 'All locations' : 'Selected locations'}</p><p><strong>Expires:</strong> {new Date(preview.expires_at).toLocaleString()}</p></div>
              <form action={acceptStaffInvitationFormAction}><input type="hidden" name="token" value={token} /><button className="rounded bg-blue-700 px-4 py-2 font-medium text-white">Accept invitation</button></form>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}
