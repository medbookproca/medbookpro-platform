import { Card } from '@medbookpro/ui';
import { redirect } from 'next/navigation';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { StaffClient } from './staff-client';

export default async function StaffSettingsPage() {
  const user = await requireAuthenticatedUser('/app/settings/staff');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');
  const supabase = await createClient();
  const [{ data: roles }, { data: locations }, { data: membershipRows }, { data: invitationRows }] = await Promise.all([
    supabase.from('roles').select('key, name').is('organization_id', null).eq('status', 'active').order('name'),
    supabase.from('locations').select('id, name').eq('organization_id', organization.organizationId).eq('status', 'active').order('name'),
    supabase.from('organization_memberships').select('id, status, profile_id, profiles(display_name, preferred_name)').eq('organization_id', organization.organizationId).order('created_at'),
    supabase.from('invitations').select('id, email_normalized, status, expires_at, invitation_role_assignments(roles(name))').eq('organization_id', organization.organizationId).in('status', ['pending', 'expired']).order('created_at', { ascending: false }),
  ]);
  if (!membershipRows || !roles || !locations || !invitationRows) {
    return <main className="min-h-screen bg-slate-50 p-6"><Card><p role="alert">Staff data is temporarily unavailable.</p></Card></main>;
  }
  const memberIds = membershipRows.map((member) => member.id);
  const { data: assignments } = memberIds.length ? await supabase.from('membership_roles').select('membership_id, roles(name)').in('membership_id', memberIds) : { data: [] };
  const rolesByMember = new Map<string, string[]>();
  const typedAssignments = (assignments ?? []) as Array<{ membership_id: string; roles: { name: string } | { name: string }[] | null }>;
  for (const assignment of typedAssignments) {
    const name = Array.isArray(assignment.roles) ? assignment.roles[0]?.name : assignment.roles?.name;
    if (name) rolesByMember.set(assignment.membership_id, [...(rolesByMember.get(assignment.membership_id) ?? []), name]);
  }
  const members = membershipRows.map((member) => {
    const profile = Array.isArray(member.profiles) ? member.profiles[0] : member.profiles;
    return { id: member.id, name: profile?.preferred_name ?? profile?.display_name ?? 'Staff member', email: profile?.display_name ?? 'Account email unavailable', status: member.status, roles: rolesByMember.get(member.id) ?? [] };
  });
  const typedInvitations = invitationRows as Array<{ id: string; email_normalized: string; status: string; expires_at: string; invitation_role_assignments: Array<{ roles: { name: string } | { name: string }[] | null }> }>;
  const invitations = typedInvitations.map((invitation) => ({ id: invitation.id, email: invitation.email_normalized, status: invitation.status, expiresAt: invitation.expires_at, roleNames: (invitation.invitation_role_assignments ?? []).flatMap((assignment) => Array.isArray(assignment.roles) ? assignment.roles.map((role) => role.name) : assignment.roles?.name ? [assignment.roles.name] : []) }));
  return <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-5xl"><p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Settings</p><h1 className="mt-2 text-4xl font-semibold tracking-tight">Staff and memberships</h1><p className="mt-3 text-slate-600">Manage access for {organization.organizationName}. Changes are checked transactionally by the database.</p><div className="mt-8"><StaffClient roles={roles} locations={locations} members={members} invitations={invitations} /></div></div></main>;
}
