# Warehouse growth programs

Warehouse growth programs lets operators manage promotional events, retailer placements, in-store demos, and their cross-party requests.

## Sub-features

- `warehouse-promo-events` covers event list, detail, filtering, and create boundary.
- `warehouse-placements` covers placement list and detail.
- `warehouse-placement-requests` covers request review and lifecycle actions.
- `warehouse-demos` covers retailer demo enablement and detail.
- `warehouse-demo-requests` covers request review and scheduling state.

## How to get to it (user POV)

- Choose `Promo Events` for `/home/promo-events`, then open `/home/promo-events/<id>`.
- Choose Placements → `Placements` or `Requests` for `/home/placements` and `/home/placements/requests`.
- Open placement detail `/home/placements/<id>` or request `/home/placements/requests/<id>`.
- Choose Demos → `Demos` or `Requests` for `/home/demos` and `/home/demos/requests`.
- Open demo detail `/home/demos/<id>` or request `/home/demos/requests/<id>`.

## Driving it

Preconditions:

- Warehouse doctor and admin authentication pass.
- Use `/query-local-db` to select isolated event, placement, and demo fixtures matching the requested lifecycle states.
- Queue and test-safe email configuration are required before proving notifications. Record all status, date, location, participant, and notification settings before mutation.

- **Promo events.** Require `Promo Events`, `Create Promo Event`, filters `All`, `Upcoming`, `Active`, and `Past`, plus event cards or `Error loading promo events`. Open an event and verify its identity, window, participation, coverage, and status. Open create and cancel by default.
- **Placements.** Require `Placements`, retailer/location/status/type filters, and count `<N> placements`, or `Unable to load placements` with `Try again`. Open a detail and inspect fields without saving.
- **Placement requests.** Require `Placement Requests`, then open a request and verify status, location, brand, internal reason, and notification controls. Status or approval changes and lifecycle email are explicit mutations.
- **Demos.** Require `Demos`, rows or explicit error, and `Enable Retailer`. Open `Enable demo` or `Update demo` and cancel; saving changes retailer eligibility.
- **Demo requests.** Require `Demo Requests`, filters such as `Status`, `Execution Mode`, and `Location`, then open one request and verify matching detail without editing.
- **Proof.** Record entity IDs, lifecycle states, selected filters, email/queue posture, and any authorized before/after mutation. Cross-surface changes require matching marketplace evidence under `/verify-airgoods-web`.

## Gotchas

- Placement and demo request updates can notify brands or retailers.
- Creating promo events can expose customer-visible discounts and enrollment.
- List state can persist across detail navigation; record inherited filters before judging results.
- UI success proves persistence or enqueueing, not email delivery.
- Never expose retailer locations, brand contacts, request messages, schedules, or recipient lists in screenshots or video.
