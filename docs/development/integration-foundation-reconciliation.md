# Integration Foundation Reconciliation

Integrations are provider-neutral organization metadata. They connect future workflows to existing patients, appointments, encounters, billing, communications, documents, telehealth, and patient portal boundaries without duplicating those records.

## Domain interactions

- **Clinical and patient data:** future FHIR, HL7, laboratory, and imaging adapters must resolve tenant and patient context through reviewed mappings; this phase stores no clinical payloads.
- **Scheduling and communications:** calendar, payment, SMS, and email providers are catalogued only. No external event or credential is sent.
- **Documents and telehealth:** future attachments, meetings, recordings, and transcripts require explicit consent, retention, and access reviews.
- **Future AI, mobile, and public API:** API clients, keys, jobs, and event metadata provide boundaries for future consumers without implementing public access or AI processing.

All connections, keys, webhooks, jobs, and logs are organization-scoped. Existing audit and membership helpers remain authoritative.
