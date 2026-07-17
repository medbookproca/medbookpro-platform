# Database testing

Run the identity database tests with:

```sh
supabase test db
```

The test suite uses synthetic `.invalid` identities and exercises RLS under the `authenticated` role with JWT subject claims. It covers cross-tenant reads, membership suspension and revocation, clinic/location scopes, permission resolution, unauthorized writes, invitation token storage, audit append restrictions, and profile role-boundary checks.

Tests must not bypass RLS by using the service role as evidence of client isolation. Future policy changes require positive and negative tests using local fixtures only.
