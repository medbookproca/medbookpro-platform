import { redirect } from 'next/navigation';
import { AppShell } from '@/components/app-shell';
import { getActiveOrganizationContext } from '@/lib/organization-context';
import { requireAuthenticatedUser } from '@/lib/supabase/auth-helpers';

export default async function AuthenticatedApplicationLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAuthenticatedUser('/app');
  const organization = await getActiveOrganizationContext(user.id);
  if (!organization) redirect('/onboarding');

  return (
    <AppShell
      email={user.email ?? null}
      organizationName={organization.organizationName}
      locationName={organization.locationName}
      roleKeys={organization.roleKeys}
    >
      {children}
    </AppShell>
  );
}
