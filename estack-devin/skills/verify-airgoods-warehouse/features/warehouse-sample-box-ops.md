# Warehouse sample-box operations

Sample-box operations lets operators review box cycles and applications, inspect buyer assignments, preview autopick, and manage warehouse inventory and product groups.

## Sub-features

- `warehouse-boxes` covers box lists, box detail, and buyer assignments.
- `warehouse-bulk-autopick` covers preview and the explicitly authorized autopick boundary.
- `warehouse-applications` covers supplier application review.
- `warehouse-inventory` covers variant inventory, filters, exports, and upload boundaries.
- `warehouse-product-groups` covers product-group listing and reversible editing.

## How to get to it (user POV)

- Choose `Boxes` for `/home/boxes`, then open `/home/boxes/<boxId>` or a buyer assignment at `/home/boxes/<boxId>/<sampleBoxBuyerId>`.
- From a box choose `Bulk Autopick` for `/home/boxes/<boxId>/bulk-autopick`.
- Choose `Applications` for `/home/applications`.
- Choose `Inventory` for `/home/inventory`, then `Product Groups` for `/home/inventory/groups`.

## Driving it

Preconditions:

- Warehouse doctor and admin authentication pass.
- Use `/estack-devin:query-local-db` to select an isolated box cycle, application, inventory row, or product group matching the requested state.
- Queue health is required for autopick and inventory imports. Record box phase, assignments, inventory, and group state before any mutation.

- **Boxes.** Require heading `Sample Boxes`, phase badges, and cards or `Error loading boxes`. Open a box and require its title, `Stores eligible`, and `Bulk Autopick`. Do not ship, upload buyers/addresses, change dates, reshuffle, or bulk-edit suppliers unless explicitly scoped.
- **Autopick.** Require `Bulk Autopick Preview — Box #<id>`, `Back to Box`, and prior run state such as `No runs yet`. A preview may show `Running bulk preview for all stores…`. `Run Bulk Autopick` must open `Confirm Bulk Autopick`; never choose `Confirm & Run` without explicit authorization because it writes picks and can trigger notifications.
- **Applications.** Require `Applications`, status filtering, and rows or settled empty state. Open one application and inspect `Approve` or `Waitlist` boundaries without submitting.
- **Inventory.** Require `Inventory`, `Product Groups`, `Download Inventory`, `Update Inventory`, and relevant availability/location/expiration filters. Exercise search/filter and open export/upload dialogs. Do not upload unless the exact changed rows and rollback are defined.
- **Product groups.** Require `Product Groups`, `Back to Inventory`, and `Create Product Group` or `Create Group`. Open create/edit and cancel; mutate only a uniquely named branch-local group that can be removed safely.
- **Proof.** Record box/application/product/variant/group IDs, initial state, queue posture, action boundaries, and final read-only confirmation.

## Gotchas

- Application approval or waitlist can email suppliers and change access.
- `Confirm & Run` is not a harmless preview; autopick can affect an entire box cycle.
- Shipping, label purchase, buyer/address upload, date changes, and bulk supplier operations are persistent or external.
- Inventory updates can fan out across many variants; use tiny synthetic inputs only.
- Inventory pages may load per-row warehouse data slowly. Wait for settled rows rather than fixed time.
- Never capture retailer assignments, addresses, application contacts, labels, or inventory source files in evidence.
