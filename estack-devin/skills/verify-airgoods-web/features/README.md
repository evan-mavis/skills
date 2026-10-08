# airgoods marketplace web verification map

this directory is the maintained source for verifying the marketplace experience in `apps/web`. public landing, editorial, cms, and seo behavior belongs to `/estack-devin:verify-airgoods-web-public`.

## baseline preconditions

- work from the current git root with the node version in `.node-version`.
- follow the local launch and ownership instructions in `../SKILL.md`; reuse the configured local environment and start only missing app processes.
- resolve ports from existing app configuration and verified listeners; do not generate or provision an environment.
- marketplace mode requires healthy backend and web services from this checkout.
- use a run-owned browser tab/session for verification. do not alter a user's existing browser tab or authenticated session.
- run the doctor checks in `../SKILL.md` before driving.

## driving conventions

- start each recipe from its named path and preconditions.
- prefer aria roles and accessible names over css selectors or dom position.
- treat quoted labels, paths, and selectors as literal.
- use the selected browser harness for navigation, snapshots, clicks, fills, key presses, and screenshots.
- wait for an observable role, heading, url, or content change instead of sleeping.
- finalize recordings and close only the browser tab/session created by the run.

## proof and skip reporting

- warn before driving when no feature file covers the requested surface, route, state, action, or proof. label any safe exploratory fallback `unmapped`.
- save evidence under `<evidence-root>/verify-airgoods-web/<run-id>/`.
- capture accessibility state before and after the action plus a result screenshot.
- for user-visible bugs, capture recorded walkthroughs `video_before` and `video_after`; for features and improvements, capture one `video_demo`.
- required videos must come from a recorder supported by the selected harness. if recording is unavailable, report blocked proof. screenshot-only proof is supplemental, not a substitute.
- record the feature id, exact url, git sha, mode, and service ownership.
- for api-backed behavior, retain the relevant response or a read-only confirmation.
- report an unreachable path with the attempted route and missing prerequisite.
- shared public chrome, auth handoff, or proxy behavior also requires `/estack-devin:verify-airgoods-web-public`.

## feature entry contract

each feature file describes user-visible behavior and uses exactly four h2 sections:

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it`
4. `Gotchas`

## features

- [marketplace discovery](./marketplace-discovery.md) covers product and brand browsing, view switching, search, and detail-page entry.
- [buyer purchase flow](./buyer-purchase-flow.md) covers product selection, add to cart, cart minimums, checkout, and explicitly authorized order placement.
- [signed-in retailer home](./signed-in-retailer-home.md) covers discover, order, grow, olive, treatment routing, and responsive tab navigation.
- [buyer post-purchase](./buyer-post-purchase.md) covers orders, deliveries, tracking, damage reporting, and reordering.
- [payments and terms](./payments-and-terms.md) covers buyer charges, payment methods, terms, invoices, seller payouts, and provider boundaries.
- [account settings](./account-settings.md) covers buyer/seller profiles, locations, team access, notifications, shipping defaults, and account security.
- [integrations](./integrations.md) covers buyer pos and seller commerce, inventory, fulfillment, connection, product-sync, and recovery flows.
- [seller operations](./seller-operations.md) covers onboarding, catalog maintenance, orders, fulfillment, shipping, and labels.
- [seller growth tools](./seller-growth-tools.md) covers discounts, promotional events, campaigns, retailer crm, segments, referrals, and widgets.
- [growth workflows](./growth-workflows.md) covers samples, sample boxes, placements, demos, messaging, and cross-audience proof.
- [buyer lists and rewards](./buyer-lists-and-rewards.md) covers favorites, my brands, loyalty, volume pricing, referrals, and csv export.
