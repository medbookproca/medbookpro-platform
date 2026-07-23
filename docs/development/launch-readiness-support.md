# Support and incident response

## Escalation levels

- **Clinic support:** configuration, navigation, and known workflow questions.
- **Application engineering:** reproducible defects, failed smoke checks, and performance symptoms.
- **Security/privacy owner:** suspected unauthorized access, credential exposure, data disclosure, or RLS concern.
- **Release owner:** rollout, rollback, certificate, backup, or availability incident.

## Intake minimum

Record time, environment, release version, route, safe correlation ID, impact, and reproduction steps using synthetic identifiers. Do not include passwords, tokens, full URLs with secrets, patient names, health information, or raw database dumps.

## Incident procedure

1. Triage impact and protect people and data first.
2. Restrict access or pause the affected workflow when necessary.
3. Preserve safe logs and timestamps; do not alter evidence.
4. Escalate privacy/security concerns immediately through the approved channel.
5. Decide rollback or containment with the release owner.
6. Communicate status, recovery, and post-incident actions.
