# Core Domain Open Questions

These questions require founder/product approval before Phase 2B migrations. Recommendations are architecture guidance, not implemented behavior.

## 1. What does `clinic` mean internally?

- **Options:** remove the intermediate concept; retain it as an operating-group aggregate; expose it as a product-level business unit.
- **Recommendation:** retain the current table only as a compatibility aggregate and use organization/location in all new product and database contracts.
- **Consequences:** avoids an immediate breaking migration but requires clear naming and future cleanup decisions.
- **Blocks implementation:** Yes, before new onboarding screens expose clinic terminology.

## 2. Can an organization exist without a location?

- **Options:** require one location atomically; allow an organization-first onboarding state; create a temporary location.
- **Recommendation:** allow organization-first state with explicit onboarding status and no operational booking until a location exists.
- **Consequences:** supports enterprise and staged setup without fake locations.
- **Blocks implementation:** Yes, for onboarding transaction design.

## 3. How should organization-wide location access be represented?

- **Options:** implicit empty scope; explicit `all_locations` mode; explicit grant row for every location.
- **Recommendation:** explicit mode plus optional exception/grant rows, with audit history.
- **Consequences:** current/future location behavior is clear but needs migration and RLS updates.
- **Blocks implementation:** Yes, for membership-location migration.

## 4. Are roles inherited from organization to location?

- **Options:** organization roles always apply everywhere; location roles override; organization roles grant baseline and location roles narrow.
- **Recommendation:** organization roles grant baseline access; location-scoped grants may narrow or add only through explicit permission semantics.
- **Consequences:** avoids accidental privilege expansion and requires clear permission evaluation order.
- **Blocks implementation:** Yes, before location-scoped role assignments.

## 5. What is the ownership-transfer policy?

- **Options:** any owner can transfer; require two-owner confirmation; require support workflow for last owner.
- **Recommendation:** prevent removal of the last active owner and require an explicit transfer operation with audit.
- **Consequences:** stronger safety, with support recovery procedures required.
- **Blocks implementation:** Yes, for owner provisioning.

## 6. Can one subscription account cover multiple organizations?

- **Options:** one-to-one only; account-to-organization join; enterprise parent account.
- **Recommendation:** one organization in the first commercial model; reserve an account-to-organization join for enterprise plans.
- **Consequences:** simple v1 billing while preserving a future expansion path.
- **Blocks implementation:** No for v1 billing; yes for enterprise billing.

## 7. What patient identifier policy is approved?

- **Options:** generated organization patient number; provincial identifier where lawful; multiple identifier types with restricted access.
- **Recommendation:** generated organization patient number plus separately governed identifier types; never use a provincial identifier as the universal key.
- **Consequences:** supports duplicate detection without over-collecting sensitive identifiers.
- **Blocks implementation:** Yes, before patient data migration.

## 8. What is the patient merge policy?

- **Options:** no merge; reversible merge; immutable survivor with alias/merge history.
- **Recommendation:** immutable survivor with auditable merge history and reversible operational workflow where legally permissible.
- **Consequences:** preserves appointment history but requires careful identity and retention controls.
- **Blocks implementation:** Yes, before duplicate tooling.

## 9. Which Canadian residency regions are required?

- **Options:** one Canadian region initially; province-specific deployment; customer-selected residency.
- **Recommendation:** start with an approved Canadian residency region and keep region/provider selection outside tenant authorization keys.
- **Consequences:** simplifies operations while preserving future regional deployment.
- **Blocks implementation:** No for logical schema; Yes for production hosting policy.

## 10. What support access model is approved?

- **Options:** no support access; time-bound consented access; emergency break-glass access.
- **Recommendation:** time-bound, least-privilege, fully audited support access with explicit customer policy and emergency controls.
- **Consequences:** enables operations without hidden service-role access.
- **Blocks implementation:** No for core tables; Yes before support tooling.

## 11. Which professional credentials may be stored?

- **Options:** basic registration metadata; jurisdiction-specific credential records; external verification references only.
- **Recommendation:** begin with minimal registration metadata and verification status; defer document storage until privacy/security review.
- **Consequences:** reduces sensitive data exposure in the practitioner foundation.
- **Blocks implementation:** Yes for credential fields beyond minimal metadata.
