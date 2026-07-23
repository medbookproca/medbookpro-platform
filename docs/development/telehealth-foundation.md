# Telehealth Foundation

## Architecture and lifecycle

`telehealth_sessions` stores organization, appointment, patient, practitioner, schedule, lifecycle, and provider-placeholder metadata. Participants, waiting-room state, chat placeholders, provider settings, and session events are separate records.

The lifecycle is `scheduled` → `waiting` → `in_progress` → `completed`, with `cancelled` and `no_show` terminal alternatives. The waiting room records patient joined, provider joined metadata, admission, and leaving; it does not establish a media channel.

## Security and privacy

Composite organization foreign keys protect every clinical reference. Staff RPCs require telehealth permissions. Patient portal calls resolve ownership from the authenticated portal account. Direct client writes are denied by RLS, and lifecycle actions create audit records.

## Future provider abstraction

Provider, meeting identifier, meeting URL, host URL, recording, and transcript fields are placeholders. Future Zoom, Google Meet, Teams, Daily, Twilio, custom providers, recording, transcription, AI assistance, mobile clients, and screen sharing require separate threat modeling and consent review.

## Limitations and rollback

No live video, audio, chat, recording, transcription, waiting-room transport, upload, or provider credentials exist. Rollback removes this migration, routes, schemas, tests, and docs; existing appointment, patient, portal, document, clinical, communications, and billing foundations remain independent.
