import 'server-only';

import { createClient } from '@/lib/supabase/server';

export interface OrganizationContext {
  organizationId: string;
  organizationName: string;
  locationName: string | null;
  roleKeys: string[];
}

export async function getActiveOrganizationContext(
  userId: string,
): Promise<OrganizationContext | null> {
  const supabase = await createClient();
  const { data: membership, error: membershipError } = await supabase
    .from('organization_memberships')
    .select('id, organization_id')
    .eq('profile_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) return null;
  const { data: organization, error: organizationError } = await supabase
    .from('organizations')
    .select('id, name, display_name')
    .eq('id', membership.organization_id)
    .eq('status', 'active')
    .maybeSingle();

  if (organizationError || !organization) return null;
  const { data: location } = await supabase
    .from('locations')
    .select('name')
    .eq('organization_id', organization.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: assignedRoles } = await supabase
    .from('membership_roles')
    .select('role_id')
    .eq('membership_id', membership.id)
    .eq('organization_id', organization.id);
  const roleIds = (assignedRoles ?? []).map((role) => role.role_id);
  const { data: roles } = roleIds.length
    ? await supabase
        .from('roles')
        .select('key')
        .in('id', roleIds)
        .eq('status', 'active')
    : { data: [] };

  return {
    organizationId: organization.id,
    organizationName: organization.display_name ?? organization.name,
    locationName: location?.name ?? null,
    roleKeys: (roles ?? []).map((role) => role.key),
  };
}
