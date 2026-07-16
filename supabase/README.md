# Supabase governance

This directory contains the local-only identity database foundation. It must never be linked to or pushed to the hosted Canadian project from this task.

- Migrations are immutable after reaching shared environments.
- Schema changes must be committed; dashboard-created changes must become reviewed migrations.
- Production data must never be used in local development.
- Governance must account for Canadian privacy and data-residency requirements.
- Future Row Level Security changes require automated policy tests before shared-environment use.
- Local commands and secret handling are documented in [local Supabase setup](../docs/development/local-supabase.md).
- Hosted project linking, deployment, and production credentials are prohibited for this foundation.
