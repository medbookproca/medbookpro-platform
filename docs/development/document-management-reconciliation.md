# Document Management Reconciliation

Documents are organization-scoped metadata records. This foundation deliberately separates metadata, version history, access events, retention state, and future storage references so a storage provider can be selected later without changing clinical ownership rules.

## Domain interactions

- **Patients:** patient references are composite organization-owned foreign keys. Patient portal reads resolve through the existing portal account and cannot cross patients or organizations.
- **Clinical encounters:** encounter references are validated against the same patient and organization; encounter document listing is permission and patient scoped.
- **Communications and billing:** documents may be categorized as administrative, invoice attachment, or clinical attachment, but no provider or message body is copied into document metadata.
- **Future boundaries:** telehealth recordings, OCR, AI indexing, e-signatures, document scanning, and external storage providers require separate security and retention decisions.

The canonical organization, patient, encounter, practitioner, location, audit, and portal foundations are reused. No duplicate patient or clinical records are introduced.
