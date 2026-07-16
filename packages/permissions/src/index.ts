export const permissionNames = ['organizations.read', 'locations.manage', 'staff.invite', 'appointments.read', 'appointments.manage'] as const;
export type Permission = (typeof permissionNames)[number];
export function isPermission(value: string): value is Permission { return (permissionNames as readonly string[]).includes(value); }
