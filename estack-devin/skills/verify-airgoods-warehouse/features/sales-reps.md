# Sales reps

Sales reps lets operators inspect team membership, retailer assignments, relationship overrides, commissions, and attributed orders.

## Sub-features

- `reps-overview` covers `/home/sales-reps`.
- `reps-team` covers team listing and create/edit/deactivate boundaries.
- `reps-assignments` covers assignments and import.
- `reps-overrides` covers relationship overrides.
- `reps-commissions` covers commission configuration and records.
- `reps-orders` covers attributed orders.

## How to get to it (user POV)

- Choose Reps, then `Overview`, `Team`, `Assignments`, `Overrides`, `Commissions`, or `Orders`.
- Routes live under `/home/sales-reps` with the selected child name.

## Driving it

Preconditions:

- Warehouse doctor and admin authentication pass.
- Use `/estack-devin:query-local-db` to choose representative rep, retailer, assignment, override, commission, and order states.
- Record all current assignments, rates, active status, and override values before opening mutation controls.

- **Overview.** Require `Reps`, summary state, and cards for Team, Assignments, Overrides, Commissions, and Orders.
- **Team.** Require `Team` and members or explicit empty state. Open create/edit and cancel. Do not create, update, or deactivate without scoped cleanup.
- **Assignments.** Require `Assignments`, filters/table state, and `Import assignments` when available. Inspect only; import can update many relationships.
- **Overrides.** Require `Relationship overrides` and rows or explicit empty state. Open create/edit and cancel; deletion and upsert are persistent.
- **Commissions.** Require `Commissions`, current defaults/configuration, and rows or explicit empty state. Do not save rates, create records, delete, or import by default.
- **Orders.** Require `Orders`, filters, and attributed rows or settled empty state. Open one row only when it does not cross into a money-moving action.
- **Proof.** Record rep, retailer, order, assignment, and override IDs; starting values; selected filters; and unchanged or restored state.

## Gotchas

- Assignment imports, overrides, commission changes, and rep deactivation can affect compensation and ownership across many accounts.
- Read-only order attribution is not proof of payout correctness.
- Empty results require a successful settled response.
- Never expose employee compensation, personal contact data, private assignments, or commission amounts in walkthrough artifacts.
