# Telehealth Reconciliation

Telehealth sessions are organization-aware metadata around existing virtual appointments. The foundation does not create a video connection, meeting credential, recording, transcript, chat message, or external-provider account.

## Existing boundaries

- **Appointments:** sessions reference an existing appointment and validate patient/practitioner context.
- **Patient portal:** portal identity resolves through the existing patient portal account; patients can see and join only their own session waiting room.
- **Documents, communications, billing, and clinical encounters:** those domains remain authoritative. Future recordings, transcripts, consents, invoices, or encounter artifacts must use separately reviewed integrations.
- **Future AI, transcription, waiting room, and mobile:** provider-neutral metadata allows later clients and assistants without weakening tenant isolation.

The provider list is a placeholder catalogue only: Zoom, Google Meet, Microsoft Teams, Daily, Twilio, and custom provider.
