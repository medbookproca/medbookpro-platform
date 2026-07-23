# Communications Reconciliation

Phase 2H adds a tenant-scoped notification foundation only. Existing `patient_contacts` remains the source for contact addresses and contact-consent fields; `patient_notification_preferences` owns notification-specific choices such as appointment reminders, channel enablement, language, marketing preference, and future quiet hours. This avoids silently replacing the patient foundation while giving notification workflows a stable boundary.

Appointments, patients, organizations, memberships, permissions, and `audit_events` are reused through organization-scoped foreign keys and security-definer RPCs. Staff access is resolved by the existing permission catalogue. The phase adds `communications.create`, `communications.manage_templates`, and `communications.manage_settings` while retaining the earlier reserved `communications.read`, `communications.send`, and `communications.send_bulk` keys.

Templates are organization-owned, language-aware, and versioned. Editing creates a new version and deactivates the previous active version. Queue records are organization-owned and reference patients and optional appointments. Delivery and event records preserve the mock-provider boundary and auditability.

No Twilio, SendGrid, Mailgun, Azure Communication Services, WhatsApp, push service, patient portal, or external calendar provider is called. Provider selection is deliberately `mock` only. Future integrations must be introduced behind the provider interface, with Canadian privacy review, consent rules, retry limits, delivery observability, and explicit data-retention decisions.

RLS permits tenant-scoped reads only when the caller has a communications read permission. All writes are denied directly and must use server-side RPCs that check the caller's organization permission and write audit events. This phase does not implement patient-facing messaging or automated reminder scheduling.
