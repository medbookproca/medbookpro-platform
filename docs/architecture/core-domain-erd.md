# MedBookPro Core Domain ERD

This is a conceptual ERD for Phase 2A. It intentionally includes future domain entities without creating tables or migrations. Existing identity names are shown where they are already implemented; proposed canonical names are used for future core-domain objects.

## Identity and access

```mermaid
erDiagram
    AUTH_USER ||--|| PROFILE : "has application profile"
    PROFILE ||--o{ MEMBERSHIP : "holds"
    ORGANIZATION ||--o{ MEMBERSHIP : "has"
    MEMBERSHIP ||--o{ MEMBERSHIP_LOCATION_ACCESS : "grants"
    LOCATION ||--o{ MEMBERSHIP_LOCATION_ACCESS : "is scoped"
    MEMBERSHIP ||--o{ MEMBERSHIP_ROLE : "receives"
    ROLE ||--o{ MEMBERSHIP_ROLE : "assigned"
    ROLE ||--o{ ROLE_PERMISSION : "bundles"
    PERMISSION ||--o{ ROLE_PERMISSION : "included"
    ORGANIZATION ||--o{ ROLE : "may define custom"
    ORGANIZATION ||--o{ CLINIC_COMPATIBILITY_GROUP : "currently groups"
    CLINIC_COMPATIBILITY_GROUP ||--o{ LOCATION : "currently contains"

    AUTH_USER {
        uuid id PK
    }
    PROFILE {
        uuid id PK
        text status
    }
    ORGANIZATION {
        uuid id PK
        text legal_name
        text display_name
        text slug UK
        text status
        text default_timezone
        text default_currency
        text onboarding_state
    }
    CLINIC_COMPATIBILITY_GROUP {
        uuid id PK
        uuid organization_id FK
        text name
        text status
    }
    LOCATION {
        uuid id PK
        uuid organization_id FK
        uuid clinic_id FK
        text kind
        text name
        text timezone
        text status
    }
    MEMBERSHIP {
        uuid id PK
        uuid organization_id FK
        uuid profile_id FK
        text status
    }
    MEMBERSHIP_LOCATION_ACCESS {
        uuid id PK
        uuid membership_id FK
        uuid organization_id FK
        uuid location_id FK
        text access_kind
        timestamptz expires_at
    }
    ROLE {
        uuid id PK
        uuid organization_id FK
        text key
        text kind
        int version
    }
    PERMISSION {
        uuid id PK
        text key UK
        text status
    }
    ROLE_PERMISSION {
        uuid role_id FK
        uuid permission_id FK
    }
    MEMBERSHIP_ROLE {
        uuid id PK
        uuid membership_id FK
        uuid role_id FK
        timestamptz expires_at
    }
```

## Practitioners, patients, services, and appointments

```mermaid
erDiagram
    ORGANIZATION ||--o{ PRACTITIONER : owns
    AUTH_USER o|--o| PRACTITIONER : "optionally links"
    PRACTITIONER ||--o{ PRACTITIONER_LOCATION : works_at
    LOCATION ||--o{ PRACTITIONER_LOCATION : hosts
    ORGANIZATION ||--o{ PATIENT : owns
    PATIENT ||--o{ PATIENT_IDENTIFIER : has
    PATIENT ||--o{ PATIENT_CONTACT : has
    ORGANIZATION ||--o{ SERVICE : defines
    SERVICE ||--o{ LOCATION_SERVICE : available_at
    LOCATION ||--o{ LOCATION_SERVICE : offers
    SERVICE ||--o{ PRACTITIONER_SERVICE : eligible
    PRACTITIONER ||--o{ PRACTITIONER_SERVICE : provides
    ORGANIZATION ||--o{ APPOINTMENT : owns
    LOCATION ||--o{ APPOINTMENT : scheduled_at
    PRACTITIONER ||--o{ APPOINTMENT : performs
    PATIENT ||--o{ APPOINTMENT : attends
    SERVICE ||--o{ APPOINTMENT : books

    PRACTITIONER {
        uuid id PK
        uuid organization_id FK
        uuid auth_user_id FK
        text status
        text professional_title
        text registration_jurisdiction
        text booking_visibility
    }
    PRACTITIONER_LOCATION {
        uuid practitioner_id FK
        uuid location_id FK
        text status
        date effective_from
        date effective_to
    }
    PATIENT {
        uuid id PK
        uuid organization_id FK
        text patient_number
        text legal_name
        text preferred_name
        date date_of_birth
        text status
        timestamptz archived_at
    }
    PATIENT_IDENTIFIER {
        uuid id PK
        uuid patient_id FK
        text identifier_type
        text normalized_value
    }
    PATIENT_CONTACT {
        uuid id PK
        uuid patient_id FK
        text contact_type
        text value
        boolean is_primary
    }
    SERVICE {
        uuid id PK
        uuid organization_id FK
        text name
        int duration_minutes
        int buffer_minutes
        numeric base_price
        text currency
        text modality
        text status
    }
    LOCATION_SERVICE {
        uuid id PK
        uuid location_id FK
        uuid service_id FK
        boolean bookable
        numeric local_price
    }
    PRACTITIONER_SERVICE {
        uuid id PK
        uuid practitioner_id FK
        uuid service_id FK
        boolean eligible
    }
    APPOINTMENT {
        uuid id PK
        uuid organization_id FK
        uuid location_id FK
        uuid patient_id FK
        uuid practitioner_id FK
        uuid service_id FK
        timestamptz starts_at_utc
        timestamptz ends_at_utc
        text timezone_context
        text status
        text booking_source
    }
```

## Commercial and audit boundaries

```mermaid
erDiagram
    ORGANIZATION ||--o| SUBSCRIPTION_ACCOUNT : "commercially uses"
    SUBSCRIPTION_ACCOUNT ||--o{ SUBSCRIPTION_TRIAL : has
    SUBSCRIPTION_ACCOUNT ||--o{ ENTITLEMENT : grants
    ORGANIZATION ||--o{ INVITATION : receives
    PROFILE ||--o{ INVITATION : sends
    ORGANIZATION ||--o{ AUDIT_EVENT : scopes
    PROFILE o|--o{ AUDIT_EVENT : acts
    LOCATION o|--o{ AUDIT_EVENT : contextualizes

    SUBSCRIPTION_ACCOUNT {
        uuid id PK
        text plan_key
        text status
        text provider_customer_ref
        timestamptz grace_until
    }
    SUBSCRIPTION_TRIAL {
        uuid id PK
        uuid subscription_account_id FK
        timestamptz starts_at
        timestamptz ends_at
        text status
    }
    ENTITLEMENT {
        uuid id PK
        uuid subscription_account_id FK
        text key
        text value
        timestamptz effective_until
    }
    INVITATION {
        uuid id PK
        uuid organization_id FK
        text email_normalized
        text status
        timestamptz expires_at
    }
    AUDIT_EVENT {
        uuid id PK
        uuid organization_id FK
        uuid actor_profile_id FK
        uuid location_id FK
        text action
        text subject_type
        uuid subject_id
        timestamptz occurred_at
        jsonb safe_metadata
    }
```

### ERD rules

- `organization_id` is required directly on sensitive organization-owned entities.
- Location scope is subordinate to organization scope.
- `AUTH_USER` is the external Supabase Auth reference; it is not a tenant record.
- The existing `CLINIC_COMPATIBILITY_GROUP` is shown only to make the current schema layer explicit.
- Appointment and audit history must survive archival of related operational records.
