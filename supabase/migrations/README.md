# Migrations

Identity migrations are timestamped and ordered. Each schema change must be reviewed, committed, and treated as immutable after reaching a shared environment. Apply them locally with `supabase db reset`; dashboard-created changes must become reviewed migrations before use.
