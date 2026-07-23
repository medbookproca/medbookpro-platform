'use client';

import { useActionState } from 'react';
import { Card } from '@medbookpro/ui';
import {
  cancelStaffInvitationAction,
  createStaffInvitationAction,
  resendStaffInvitationAction,
  updateMembershipStatusAction,
  type StaffActionResult,
} from './actions';

type Role = { key: string; name: string };
type Location = { id: string; name: string };
type Member = { id: string; name: string; email: string; status: string; roles: string[] };
type Invitation = { id: string; email: string; status: string; expiresAt: string; roleNames: string[] };

const initial: StaffActionResult = {};

function Result({ state }: { state: StaffActionResult }) {
  if (state.error) return <p role="alert" className="mt-3 text-sm text-red-700">{state.error}</p>;
  if (state.success) return <p role="status" className="mt-3 text-sm text-green-700">{state.success}</p>;
  return null;
}

export function StaffClient({ roles, locations, members, invitations }: { roles: Role[]; locations: Location[]; members: Member[]; invitations: Invitation[] }) {
  const [inviteState, inviteAction, invitePending] = useActionState((_: StaffActionResult, formData: FormData) => createStaffInvitationAction(formData), initial);
  const invoke = (action: (formData: FormData) => Promise<StaffActionResult>) => async (formData: FormData) => { await action(formData); };
  return (
    <div className="space-y-8">
      <Card>
        <h2 className="text-xl font-semibold">Invite staff</h2>
        <p className="mt-1 text-sm text-slate-600">Create an invitation without exposing tokens to the browser.</p>
        <form action={inviteAction} className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Email<input name="email" type="email" required className="mt-1 block w-full rounded border border-slate-300 px-3 py-2" /></label>
          <label className="text-sm font-medium">Location access<select name="accessMode" defaultValue="all" className="mt-1 block w-full rounded border border-slate-300 px-3 py-2"><option value="all">All locations</option><option value="selected">Selected locations</option></select></label>
          <fieldset className="md:col-span-2"><legend className="text-sm font-medium">Roles</legend><div className="mt-2 flex flex-wrap gap-4">{roles.map((role) => <label key={role.key} className="text-sm"><input type="checkbox" name="roleKeys" value={role.key} className="mr-2" />{role.name}</label>)}</div></fieldset>
          <fieldset className="md:col-span-2"><legend className="text-sm font-medium">Selected locations</legend><div className="mt-2 flex flex-wrap gap-4">{locations.map((location) => <label key={location.id} className="text-sm"><input type="checkbox" name="locationIds" value={location.id} className="mr-2" />{location.name}</label>)}</div></fieldset>
          <button disabled={invitePending} className="w-fit rounded bg-blue-700 px-4 py-2 font-medium text-white disabled:opacity-50">{invitePending ? 'Creating…' : 'Create invitation'}</button>
        </form>
        <Result state={inviteState} />
        {inviteState.acceptanceUrl && <p className="mt-2 break-all text-xs text-slate-600">Local acceptance link: {inviteState.acceptanceUrl}</p>}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Current staff</h2>
        <div className="mt-4 divide-y divide-slate-200">{members.map((member) => <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{member.name}</p><p className="text-sm text-slate-600">{member.email} · {member.roles.join(', ') || 'No roles'} · {member.status}</p></div><div className="flex gap-2"><form action={invoke(updateMembershipStatusAction)}><input type="hidden" name="membershipId" value={member.id} /><input type="hidden" name="status" value={member.status === 'suspended' ? 'active' : 'suspended'} /><button className="rounded border border-slate-300 px-3 py-1.5 text-sm">{member.status === 'suspended' ? 'Reactivate' : 'Suspend'}</button></form><form action={invoke(updateMembershipStatusAction)}><input type="hidden" name="membershipId" value={member.id} /><input type="hidden" name="status" value="removed" /><button className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700">Remove</button></form></div></div>)}</div>
        {members.length === 0 && <p className="mt-4 text-sm text-slate-600">No staff memberships found.</p>}
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Pending invitations</h2>
        <div className="mt-4 divide-y divide-slate-200">{invitations.map((invitation) => <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{invitation.email}</p><p className="text-sm text-slate-600">{invitation.roleNames.join(', ') || 'No roles'} · {invitation.status} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</p></div><div className="flex gap-2"><form action={invoke(resendStaffInvitationAction)}><input type="hidden" name="invitationId" value={invitation.id} /><button className="rounded border border-slate-300 px-3 py-1.5 text-sm">Resend</button></form><form action={invoke(cancelStaffInvitationAction)}><input type="hidden" name="invitationId" value={invitation.id} /><button className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-700">Cancel</button></form></div></div>)}</div>
        {invitations.length === 0 && <p className="mt-4 text-sm text-slate-600">No pending invitations.</p>}
      </Card>
    </div>
  );
}
