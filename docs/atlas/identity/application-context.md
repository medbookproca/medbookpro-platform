# Application context

The future authenticated context is a convenience projection, not an authorization token:

```text
currentUser
currentProfile
availableOrganizations
activeOrganization
availableClinics
activeClinic
availableLocations
activeLocation
effectiveRoles
effectivePermissions
```

## Browser-safe state

The browser may store opaque IDs and display metadata needed for navigation, such as selected organization/clinic/location, names, status labels, and a short-lived permission projection. It must not store service-role keys, passwords, Auth secrets, invitation tokens, or treat the projection as proof of access.

## Server revalidation

Server loaders, route handlers, server actions, and database policies must revalidate `auth.uid()`, profile status, active membership, resource parentage, scope, role status, and permission resolution. Context is reloaded after sign-in, sign-out, membership changes, role changes, suspension, and organization switching. Stale context fails closed.

## Switching rules

An active organization must be in the available organization set. An active clinic must belong to it and be allowed by membership scope. An active location must belong to the active clinic and be allowed by both scope and lifecycle status. Switching never changes membership or role assignments.
