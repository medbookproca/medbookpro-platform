export interface AppNavigationItem {
  label: string;
  href: string;
  description: string;
  roles?: string[];
}

const administratorRoles = [
  'organization.owner',
  'organization.admin',
  'clinic.admin',
  'location.manager',
];

const reportRoles = [
  ...administratorRoles,
  'receptionist',
  'practitioner',
  'billing.specialist',
  'marketing.staff',
  'read.only.auditor',
];

export const appNavigation: AppNavigationItem[] = [
  { label: 'Dashboard', href: '/app', description: 'Clinic overview' },
  {
    label: 'Patients',
    href: '/app/patients',
    description: 'Organization-owned patient identity',
    roles: reportRoles,
  },
  {
    label: 'Appointments',
    href: '/app/appointments',
    description: 'Scheduling and availability',
    roles: reportRoles,
  },
  {
    label: 'Practitioners',
    href: '/app/practitioners',
    description: 'Practitioner profiles and availability',
    roles: administratorRoles,
  },
  {
    label: 'Clinical',
    href: '/app/clinical',
    description: 'Encounters and clinical notes',
    roles: [
      'organization.owner',
      'organization.admin',
      'clinic.admin',
      'location.manager',
      'practitioner',
    ],
  },
  {
    label: 'Documents',
    href: '/app/documents',
    description: 'Document foundation',
    roles: reportRoles,
  },
  {
    label: 'Reports',
    href: '/app/reports',
    description: 'Descriptive operational reporting',
    roles: reportRoles,
  },
  {
    label: 'Communications',
    href: '/app/communications',
    description: 'Communication foundation',
    roles: [
      'organization.owner',
      'organization.admin',
      'clinic.admin',
      'location.manager',
      'marketing.staff',
    ],
  },
  {
    label: 'Billing',
    href: '/app/billing',
    description: 'Billing foundation',
    roles: ['organization.owner', 'organization.admin', 'billing.specialist'],
  },
  {
    label: 'Telehealth',
    href: '/app/telehealth',
    description: 'Telehealth foundation',
    roles: [
      'organization.owner',
      'organization.admin',
      'clinic.admin',
      'location.manager',
      'practitioner',
    ],
  },
  {
    label: 'AI Assistant',
    href: '/app/ai',
    description: 'AI governance foundation',
    roles: [
      'organization.owner',
      'organization.admin',
      'clinic.admin',
      'practitioner',
    ],
  },
  {
    label: 'Integrations',
    href: '/app/integrations',
    description: 'Provider-neutral integration metadata',
    roles: administratorRoles,
  },
  {
    label: 'Staff',
    href: '/app/settings/staff',
    description: 'Membership and invitations',
    roles: administratorRoles,
  },
];

export function getVisibleAppNavigation(
  roleKeys: string[],
): AppNavigationItem[] {
  const roles = new Set(roleKeys);
  return appNavigation.filter(
    (item) => !item.roles || item.roles.some((role) => roles.has(role)),
  );
}
