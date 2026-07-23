# Document Management Foundation

## Architecture

`documents` stores organization-aware metadata only. `document_versions` stores immutable version metadata with a current-version marker and previous-version reference. Categories, retention rules, access logs, placeholder shares, and document events are separate tables for explicit lifecycle boundaries.

The storage provider, path, checksum, and file size fields are metadata contracts. No Supabase Storage, S3, Azure, Google Cloud, upload endpoint, virus scanner, OCR engine, or external provider is connected.

## Security and privacy

All document records carry organization identity. Patient and encounter references use composite organization foreign keys. Direct client writes are denied by RLS; security-definer RPCs re-check membership permissions and patient portal ownership. Access actions are logged, and metadata changes, archive, restore, version, and retention events are written to `audit_events`.

## Retention and future work

Retention state, scheduled deletion, archive state, and legal-hold placeholders are metadata only. No deletion worker or automatic purge exists. Future OCR, e-signatures, AI indexing, scanning, telehealth attachments, and storage providers must preserve the same tenant and patient boundaries.

## Limitations and rollback

There are no file uploads, previews, downloads, shares, credentials, or production storage integrations. Rollback removes the document migration, routes, schemas, and docs together; existing patient, clinical, billing, communications, and portal foundations remain independent.
