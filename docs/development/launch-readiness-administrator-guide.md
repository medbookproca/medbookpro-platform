# Administrator guide

Administrators manage clinic configuration through approved application workflows and least-privilege roles. They must not share accounts, request service-role keys, or export patient data for troubleshooting.

## Routine maintenance

- Review `/health`, `/ready`, and `/version` during the approved maintenance window.
- Review failed jobs, audit events, and support escalations without copying sensitive payloads.
- Confirm staff access and deactivate access through approved identity processes when employment changes.
- Record configuration changes and the responsible administrator.

## Maintenance procedure

Announce the window, confirm rollback owner, take the approved backup evidence, deploy only the reviewed release, run smoke checks, and communicate completion or rollback. Never perform ad hoc schema edits in a shared environment.
