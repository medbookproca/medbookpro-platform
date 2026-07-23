# Production security sign-off

The release owner must attach evidence or an explicit accepted risk for each item.

- [ ] Authentication lifecycle, recovery, session, redirect, and account deactivation reviewed.
- [ ] Authorization and deny-by-default permission boundaries reviewed.
- [ ] RLS tenant, patient, practitioner, portal, and integration isolation tested.
- [ ] Audit logging, access logging, retention, and review ownership confirmed.
- [ ] Privacy and minimum-necessary access requirements reviewed for the pilot.
- [ ] API keys and environment values are held only in approved secret stores.
- [ ] Integration placeholders are disabled or explicitly governed.
- [ ] AI governance covers human review, sensitive data handling, provenance, and no autonomous clinical decisions.
- [ ] Telehealth governance covers consent, identity, session records, and provider boundaries.
- [ ] Incident notification and evidence-preservation paths are documented.
