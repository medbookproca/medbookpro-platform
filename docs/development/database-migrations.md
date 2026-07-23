# Database migrations

Identity migrations are timestamped, ordered, and immutable after reaching a shared environment. A schema change must be committed as a reviewed migration; dashboard-created changes must be converted into reviewed migrations before use.

Apply locally with `supabase db reset`. Review the generated SQL and inspect the resulting schema before sharing a migration. Never edit an applied migration in place; create a corrective migration.

The current migrations create the documented identity, practitioner, availability, patient, appointment, clinical, communications, billing, reporting, and patient portal foundation tables. The portal reuses canonical patient consent and notification-preference tables and does not create credentials. CRM and AI workflows remain out of scope. Local seed data is separate from migrations and contains no real people or credentials.
