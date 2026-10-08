# Warehouse payments

Warehouse payments lets operators inspect orders and transactions, manage marketplace invoices, review reconciliation cases, and run balance audits.

## Sub-features

- `warehouse-orders` covers `/home/orders` and `/home/orders/<id>`.
- `warehouse-invoices` covers invoice list, create, edit, issue, refresh, void, payment, and PDF states.
- `warehouse-transactions` covers `/home/transactions` and transaction details.
- `warehouse-cases` covers reconciliation cases under Payments → Cases.
- `warehouse-audits` covers balance audit history and explicitly authorized runs.

## How to get to it (user POV)

- In Warehouse navigation choose Payments, then `Orders`, `Invoices`, `Transactions`, `Cases`, or `Audits`.
- Orders open at `/home/orders/<id>`.
- Invoices use `/home/invoices`, `/home/invoices/new`, and `/home/invoices/<id>/edit`.
- Transactions use `/home/transactions/<id>`.
- Cases use `/home/transaction-reviews`; Audits use `/home/discrepancies`.

## Driving it

Preconditions:

- Warehouse doctor and admin authentication pass.
- Use `/estack-devin:query-local-db` to select the smallest isolated order, invoice, transaction, case, or audit fixture matching the requested state.
- Record all payment, payout, invoice, reconciliation, and audit state before opening mutation controls.

- **Orders.** Require heading `Orders`; exercise `Status`, `Payment Status`, `Paid`, `Paid Out`, `Needs Transaction`, or `Candidates` when applicable. Open one row and require its order heading, badges, transaction events, cases, matches, and balance. Open `Link Transactions` and cancel. Do not choose `Mark as Paid`, `Mark as Paid Out`, or `Retry Refund`.
- **Invoices.** Require `Marketplace Invoices`, `Create invoice`, search `Invoice number, ID, or retailer`, and rows or `No invoices found.`. Open one invoice and inspect `Edit`, `Copy permalink`, and `Download PDF`. Open mutation dialogs only to verify their warning and cancel; `Issue`, `Refresh`, `Void`, and `Mark paid` are money-moving.
- **Transactions.** Require `Payment Transactions`, search `External ID, processor ID, order number, or order ID`, and rows or a settled empty state. Open a detail and verify linked order/invoice context without linking or editing.
- **Cases.** Require `Payment Cases`, status filters, `Terminology`, and rows or `No cases found.`. Inspect one open case and cancel any resolve, dismiss, or link action.
- **Audits.** Require `Audit Runs`, `Terminology`, `Run History`, and rows, `No audit runs yet.`, or `No run yet`. Open `Run audit` and cancel unless the task explicitly authorizes a balance job.
- **Proof.** Record fixture IDs, initial statuses, selected filters, exact route, response state, and all opened mutation boundaries. Payment changes require a second operator read and read-only database confirmation.

## Gotchas

- Sidebar `Cases` maps to `/home/transaction-reviews`; `Audits` maps to `/home/discrepancies`.
- Invoice issue, refresh, void, mark-paid, PDF/email, order mark-paid/out, transaction linking, case resolution, refunds, and audit runs mutate financial or reconciliation state.
- UI `Paid` can map to legacy `payed` filters; assert rendered state and response rather than spelling assumptions.
- An empty table is valid only after a successful settled response.
- Never expose customer identity, payment details, invoice bank instructions, processor IDs, or transaction payloads in evidence.
