# Supabase governance

This directory is a future integration boundary. No executable migrations, tables, functions, or project credentials belong here yet.

- Migrations are immutable after reaching shared environments.
- Schema changes must be committed; dashboard-created changes must become reviewed migrations.
- Production data must never be used in local development.
- Governance must account for Canadian privacy and data-residency requirements.
- Future Row Level Security changes require automated policy tests before shared-environment use.
