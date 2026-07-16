# Security requirements

- **Least privilege and default deny:** Grant only required permissions; no matching permission or active membership means deny.
- **MFA readiness:** Keep privileged actions and assurance levels extensible without implementing MFA UI here.
- **Sessions:** Use Supabase secure, HTTP-only cookie patterns where applicable, bounded expiry, refresh rotation, and server-side invalidation roadmap.
- **Devices and sessions:** Future device/session management should list, revoke, and audit sessions without exposing tokens.
- **Rate limits:** Apply limits to sign-in, recovery, invitation creation/acceptance, role changes, and suspicious failures.
- **Invitation abuse:** Use single-use hashes, expiry, quotas, resend controls, safe responses, and audit events.
- **Email enumeration:** Normalize internally but return generic unauthenticated responses.
- **Audit integrity:** Append through trusted code, minimize metadata, restrict mutation, and test cross-tenant visibility.
- **Service role:** Server-only, secret-managed, narrowly scoped, never in browser bundles.
- **CSRF and cookies:** Use same-site secure cookies, origin checks, CSRF protections for state-changing browser requests, and no token-in-URL patterns beyond short-lived controlled flows.
- **Redirects:** Allow-list application redirect destinations; reject arbitrary user-supplied URLs.
- **Server revalidation:** Browser context and hidden fields are hints only; authorization is recomputed server-side and in RLS.
- **Tenant isolation:** Test positive and negative cases across organizations, clinics, locations, role changes, suspension, and archival.
- **Canadian governance:** Confirm hosting/data-residency, subprocessors, retention, access, and breach-response requirements before handling production personal or health information. No compliance certification is claimed here.
- **Development data:** Never use production PHI or identifiable patient data in local development, tests, fixtures, logs, or screenshots.
