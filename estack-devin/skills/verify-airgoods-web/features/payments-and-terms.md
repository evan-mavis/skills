# Payments and terms

Payments and terms lets retailers manage how they pay, review charges and invoices, request credit terms, and lets sellers review and configure payouts.

## Sub-features

- `payments-buyer-overview` covers payable, overdue, processing, upcoming, and paid order charges at `/account/buyer/payment`.
- `payments-buyer-methods` covers default, card, and bank-account methods at `/account/buyer/payment/payment-methods`.
- `payments-buyer-terms` covers approved terms, Net 60 availability, the checkout default, and payment-terms applications.
- `payments-invoices` covers order invoice previews and retailer-owned invoice links at `/account/invoices/<publicId>`.
- `payments-seller-overview` covers upcoming and paid payouts, payout timing, payment connection, tax status, exports, and eligible manual payouts at `/account/seller/payment`.

## How to get to it (user POV)

- In buyer account navigation, choose `Payment`; expand it and choose `Payment Methods` for the saved-method list.
- From buyer `Payment`, use `Apply for Payment Terms`, `Apply for Net 60`, or `Increase`; `/account/buyer/payment?requestTerms=yes` opens the same application directly when the account is eligible.
- From a buyer order at `/account/buyer/orders/<id>`, choose `Invoice` for the order-document modal. A consolidated invoice email or a support-provided payment link opens `/account/invoices/<publicId>`.
- In seller account navigation, choose `Payment`. Sellers still onboarding can also enter from `Payment Connection` on `/account/seller/onboarding` and return through the `Onboarding` back link.

## Driving it

Preconditions:

- Full mode doctor passes. Follow `Authenticated setup` in `../SKILL.md` separately for an eligible buyer and seller; this feature is not available in public-only mode.
- Use `/estack-devin:query-local-db` against the verified isolated database. For buyer overview, select a store with confirmed, non-cancelled orders that have positive product and buyer-charge totals, an assigned payment method, and charge dates before, on, and after today as needed. Paid, pending, missing-charge-date, and overdue rows exercise distinct states.
- For payment methods, record the store's current default method and use only masked display data. Card entry also needs a billing address; bank entry needs a test-safe Plaid environment or provider-safe manual-account fixture.
- For terms, record the store's approved `netDays`, current checkout default, Net 60 limit and used balance, and whether a pending request already exists. Use accounts representing no approved terms, Net 30, Net 60 with available credit, Net 60 with its limit reached, and a pending application.
- For `/account/invoices/<publicId>`, discover an invoice owned by the signed-in retailer. Use an issued invoice with open full-order allocations for the payable case, a paid invoice for paid presentation, and a missing or other-retailer public ID only for the unavailable state.
- For seller payment, select a supplier with a known Stripe or Dots processor, known connection and tax states, available payout-period options, and shipped or delivered orders with confirmation, positive product totals, payout dates, and both paid and unpaid payout states. A manual-payout candidate must also be non-test, unpaid, and past its payout date.

Buyer drive:

- **Overview.** Open `/account/buyer/payment` and require heading `Payment`, cards `Payment Terms`, `Upcoming Charges` or `Overdue`, and `Default Payment Method` or `Payment Method`. Wait for the charge table skeleton to settle to rows or `No results found`. Exercise button filters `All`, `Upcoming`, `Processing`, `Paid`, and `Overdue` when present; fill input `Search`; verify columns such as `Number`, `Terms`, `Due Date`, `Charge`, `Payment Method`, and `Status`.
- **Loading and errors.** During fetches, accept card spinners or table skeletons. Explicit buyer failures expose alert text `Unable to load payments.`, `Unable to load your payment balance.`, or `Unable to load payment method.` with button `Try again`. A payable selection must show status `Loading orders for payment…`, alert `Unable to load orders for payment.`, or status `There are no charges to pay for this selection.` rather than a blank modal.
- **Payable preview.** For overdue data choose `Pay Overdue Orders`; otherwise choose `Pay Now` under `Total Due` or choose a future `Due by` date and its `Pay Now`. Require modal heading `Pay Now`, the selected scope text, masked `Card ••••` or `ACH ••••`, order rows, and `Total`. Close without pressing the modal's final `Pay Now`.
- **Charge table actions.** An unpaid, non-processing row exposes `Pay Now` and `Change Payment`; a paid or processing row must not. Open and close each applicable modal. Clicking a non-action part of a row must open the matching order or sample route with payment context preserved.
- **Terms.** Verify account-specific copy: `Apply for Payment Terms`, `Unlimited Net 30 Terms`, `Apply for Net 60`, `Net 60 Limit`, `Net 60 Available`, `Limit reached!`, `Increase`, or `Application submitted!`. For approved terms, open the underlined value after `Default payment terms:` and require only allowed choices among `Pay on Shipment`, `Net 15`, `Net 30`, `Net 45`, and `Net 60`. Open the application, require amount question, business-information prompts, `Cancel`, and `Submit`, then cancel. If submission is explicitly authorized, require `We've received your request!` and then `Application submitted!`.
- **Payment methods.** Open `/account/buyer/payment/payment-methods`; require heading `Payment Methods` and button `Add Payment Method`. Wait for three skeleton rows to settle to masked methods with `Default` and `Added by`, or `No payment methods found`. Open `Add Payment Method`, require dialog `Select a Payment Method`, then inspect text handles `Bank Account` and `Card`. Bank must expose `Instant Verification`, `Manual Entry`, account fields, and `Connect Bank` or `Add Account`; card must expose card fields, `Billing Address`, `Add Billing Address`, and `Save Card`.
- **Saved-method actions.** Use the current accessibility-snapshot ref for the icon-only action menu, then require menuitem `Make Default` or `Delete`. Legacy methods may instead expose `Re-enter Card Details` or `Re-connect Bank Account`. Open and close confirmation or reconnection UI without saving.
- **Invoices.** From an order, choose `Invoice`; require modal title `Invoice`, then a rendered document on wide view or `Download Invoice` on compact view. For `/account/invoices/<publicId>`, require the invoice number heading, `Bill to`, `Invoice Number`, `Invoice Date`, `Due Date`, `Payment Terms`, item columns, totals, `Payment details`, visible status, and `Online checkout is not available for invoices.` Paid invoices show `Paid` and `Remaining`; unpaid invoices show `Total due`. Loading is a centered spinner; missing, malformed, unauthorized, or other-retailer IDs must show `Invoice unavailable` and `This invoice could not be found for your retailer account.`

Seller drive:

- **Overview.** Open `/account/seller/payment`; require heading `Payment`, `Upcoming Payouts`, `Payment Connection`, and `Tax Information`. Verify `Total Amount`, `Paid by` with its date button, and either `Select Default Payout Period` or `Default payout:`. Wait for payout rows or `No results found`; exercise buttons `All`, `Paid`, and `Upcoming`, input `Search`, sortable `Due Date` and `Initiated Date`, and columns `Number`, `Customer`, `Payout`, and `Status`.
- **Payout timing.** Open `Select Default Payout Period` or the current default. Require `Select a default payout period` or `Change guaranteed payout time`, available day choices, Airgoods and Direct processing fees, and `Set Default`; close without saving.
- **Connection.** Require provider-specific connected or disconnected copy. Dots exposes `Connect Payout Method` or `Continue Onboarding` and then an outer modal containing iframe title `current-flow`; Stripe exposes `New Stripe Account`, `Existing Stripe Account`, `Continue Onboarding`, or `View Account`. Do not continue into the provider.
- **Tax.** Require either `Add Tax Info` or `View Tax Info`. Open `Tax Information` and verify `Where are you located?`; United States also shows `Federal Tax Classification`, `EIN Number`, and `How do you want to receive tax information?`. Close without `Update` and never capture the EIN.
- **Manual payout.** Only an eligible past-due row exposes `Pay out`. Prove the button's presence and eligibility through a read-only database query; do not click it.
- **Exports and proof.** Buyer and seller tables expose `Export`, dialog `Export payments table`, time-zone and date-range choices, `Cancel`, and `Download`. Opening and cancelling is read-only; an authorized download creates only a local CSV that must be removed after evidence capture. Apply the parent contract's walkthrough and evidence requirements using the relevant feature ID, account audience, route, starting state, and pass predicate.

Safe mutation rules:

- Default verification is open, inspect, filter, search, change a summary date, and cancel. Never enter real card, bank, tax, or provider credentials.
- A checkout-default terms change or `Make Default` is branch-local and reversible only when the original value or method is recorded and restored through the UI, followed by a read-only confirmation.
- Do not treat adding then deleting a payment method, re-submitting a terms application, reconnecting a payout account, changing seller payout timing, or charging/paying out funds as clean rollback. These actions leave provider, notification, audit, or account-history effects.

## Gotchas

- The buyer overview changes from `Upcoming Charges` to `Overdue` and hides the normal total/due-by layout whenever overdue orders exist. The `Overdue` filter is also absent when the overdue count is zero.
- Opening buyer `Payment` can repair a returned non-default method by making it default. Record and verify the default before claiming the page was read-only.
- The payment-method page has no explicit visible load-error state; a failed request can leave an empty card instead of `No payment methods found`. Confirm the response before calling it a valid empty state.
- `Pay Now` attempts real card or bank charges and can send buyer emails, analytics, and billing notifications. Results can be `Paid`, `Pending`, `Failed`, or mixed; `Charge Processed` does not mean every row paid.
- `Change Payment` alters the method assigned to an unpaid order. Restore the original assignment before any charge attempt.
- A payment-terms application creates a pending request and notifies the Airgoods team; there is no buyer cancel action. A pre-existing pending request replaces the button with `Application submitted!`.
- `/account/invoices/<publicId>` is authenticated and retailer-owned despite using a public UUID. The page currently displays ACH/wire instructions and no online payment control, even when backend payability says the invoice is payable.
- Order `Invoice` is a generated order document; `/account/invoices/<publicId>` is a separate consolidated-invoice surface. Do not use one as proof for the other.
- Card fields are hosted by Evervault, bank verification uses Plaid, and seller connection uses Dots or Stripe. Provider frames may be inaccessible to the selected browser harness, redirect away, open a new tab, or be unavailable with local credentials.
- Loading seller `Payment Connection` performs live provider checks and may synchronize payout/onboarding account state. Seller summary and connection failures do not expose reliable alerts; zeros, disconnected copy, or a blank card require network evidence before being called real state.
- `Set Default` writes payout history and sends a team notification; restoring the prior period adds more history and is not a clean reversal. `Pay out` initiates a real seller payout and is not reversible.
- Admin impersonation suppresses selected page analytics but does not sandbox charges, emails, Slack notifications, terms requests, provider onboarding, tax changes, or payouts. It proves local UI access only; never complete Plaid while impersonating or expose provider tokens, masked account context, invoice bank details, buyer identity, or tax data in evidence.
