# Authentication lifecycle

Supabase Auth manages credentials, verification, sessions, password recovery, and MFA primitives. MedBookPro manages profiles, organizations, memberships, roles, scopes, invitations, active context, and authorization. Neither boundary should duplicate the other’s secrets or trust decisions.

## Future flows

- **Sign up:** Auth creates the identity and sends verification; a trusted callback creates the profile after verification. No organization access exists until an onboarding transaction creates an organization and first owner membership.
- **Email verification:** Auth confirms the address. The application callback is idempotent and does not grant unrelated organization access.
- **Profile creation:** A one-to-one profile is created with safe defaults; credentials remain in Auth.
- **First owner:** A controlled server transaction creates the organization, first membership, and owner assignment, then emits audit events.
- **Sign in/out:** Auth handles credentials and session lifecycle; the application loads and revalidates profile/membership context. Sign out clears local context and invokes Auth sign-out.
- **Password reset:** Auth owns the recovery token and password change. The application validates redirect targets and does not expose token values.
- **Session refresh:** Auth refreshes the session through secure cookies/server mechanisms. Every sensitive request rechecks profile, membership status, scope, and permissions.
- **MFA:** Auth MFA enrollment/challenge is future-ready; privileged actions may require an elevated assurance level after policy approval.
- **Invitation acceptance:** A verified identity accepts a single-use invitation through a server transaction that creates/activates membership and approved assignments.
- **Suspension/revocation:** Application administrators change membership state; subsequent authorization fails immediately after commit. Auth identity suspension and global account controls remain separate.
- **Organization/clinic/location switching:** Browser state selects context; server loaders validate that the identity can access the selected resource before returning data.

No email delivery provider, login screen, signup screen, or recovery UI is implemented in this phase.
