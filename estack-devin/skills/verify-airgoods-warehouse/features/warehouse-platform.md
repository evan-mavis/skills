# Warehouse platform tools

Warehouse platform tools lets operators control marketplace integration availability and run guarded go-to-market data actions.

## Sub-features

- `warehouse-integrations` covers integration catalog listing, availability filters, and create/edit boundaries.
- `warehouse-gtm-brand-upload` covers brand CSV upload and result states.
- `warehouse-gtm-location-enrichment` covers dry-run and explicitly authorized enrichment backfills.

## How to get to it (user POV)

- Choose `Integrations` for `/home/integrations`.
- Choose `GTM` for `/home/actions`.
- From GTM choose `Upload Brand CSV` or `Location Enrichment Backfill`.

## Driving it

Preconditions:

- Warehouse doctor and admin authentication pass.
- Use `/estack-devin:query-local-db` to record current integration rows and any target brands/locations.
- Queue and external provider configuration are required for applied upload/enrichment work. Use only synthetic files and branch-local records.

- **Integrations.** Require `Integrations`, `Add integration`, availability/provider/coming-soon filters, and columns including display name and provider key. Open one edit dialog and cancel. Saving changes marketplace-facing provider availability and requires cross-surface proof.
- **GTM hub.** Require heading `GTM`, cards `Upload Brand CSV` and `Location Enrichment Backfill`, and their current readiness state.
- **Brand upload.** Open the upload flow and verify file validation, preview, mapping, and confirmation without submitting. An authorized upload must use a tiny synthetic CSV and prove every created/updated row before cleanup.
- **Location enrichment.** Prefer `Dry run`; capture proposed missing/stale counts without applying. `Apply missing/stale` or apply-all enqueues external Places/AI work and requires explicit authorization, queue health, provider configuration, and row-level proof.
- **Proof.** Record integration/brand/location IDs, initial values, selected mode, queue/provider posture, preview counts, and exact changes. Verify marketplace-visible integration changes with `/estack-devin:verify-airgoods-web`.

## Gotchas

- Integration edits affect public or account-facing provider availability.
- GTM apply modes enqueue external jobs and can update many rows.
- A successful dry run is not proof that an apply completed.
- Uploading production contact or brand data is prohibited; use synthetic branch-local fixtures.
- Admin impersonation authenticates the operator but does not sandbox provider calls.
- Never expose provider keys, uploaded source data, location details, or AI/Places payloads in evidence.
