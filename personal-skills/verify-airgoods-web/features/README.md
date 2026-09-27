# Airgoods marketplace web verification map

This directory is the maintained source for verifying the marketplace experience in `apps/web`. Public landing, editorial, CMS, and SEO behavior belongs to `$verify-airgoods-web-public`.

## Baseline preconditions

- Work from the current Git root with the Node version in `.node-version`.
- Follow the local launch and ownership instructions in `../SKILL.md`; reuse the configured local environment and start only missing app processes.
- Resolve ports from existing app configuration and verified listeners; do not generate or provision an environment.
- Marketplace mode requires healthy backend and web services from this checkout.
- Use a run-owned browser tab/session for verification. Do not alter a user's existing browser tab or authenticated session.
- Run the doctor checks in `../SKILL.md` before driving.

## Driving conventions

- Start each recipe from its named path and preconditions.
- Prefer ARIA roles and accessible names over CSS selectors or DOM position.
- Treat quoted labels, paths, and selectors as literal.
- Use the selected browser harness for navigation, snapshots, clicks, fills, key presses, and screenshots.
- Wait for an observable role, heading, URL, or content change instead of sleeping.
- Finalize recordings and close only the browser tab/session created by the run.

## Proof and skip reporting

- Warn before driving when no feature file covers the requested surface, route, state, action, or proof. Label any safe exploratory fallback `unmapped`.
- Save evidence under `<evidence-root>/verify-airgoods-web/<run-id>/`.
- Capture accessibility state before and after the action plus a result screenshot.
- For user-visible bugs, capture recorded walkthroughs `video_before` and `video_after`; for features and improvements, capture one `video_demo`.
- Required videos must come from a recorder supported by the selected harness. If recording is unavailable, report blocked proof. Screenshot-only proof is supplemental, not a substitute.
- Record the feature ID, exact URL, Git SHA, mode, and service ownership.
- For API-backed behavior, retain the relevant response or a read-only confirmation.
- Report an unreachable path with the attempted route and missing prerequisite.
- Shared public chrome, auth handoff, or proxy behavior also requires `$verify-airgoods-web-public`.

## Feature entry contract

Each feature file describes user-visible behavior and uses exactly four H2 sections:

1. `Sub-features`
2. `How to get to it (user POV)`
3. `Driving it`
4. `Gotchas`

## Features

- [Marketplace discovery](./marketplace-discovery.md) covers product and brand browsing, view switching, search, and detail-page entry.
- [Buyer purchase flow](./buyer-purchase-flow.md) covers product selection, add to cart, cart minimums, checkout, and explicitly authorized order placement.
- [Signed-in retailer home](./signed-in-retailer-home.md) covers Discover, Order, Grow, Olive, treatment routing, and responsive tab navigation.
- [Buyer post-purchase](./buyer-post-purchase.md) covers orders, deliveries, tracking, damage reporting, and reordering.
- [Payments and terms](./payments-and-terms.md) covers buyer charges, payment methods, terms, invoices, seller payouts, and provider boundaries.
- [Account settings](./account-settings.md) covers buyer/seller profiles, locations, team access, notifications, shipping defaults, and account security.
- [Integrations](./integrations.md) covers buyer POS and seller commerce, inventory, fulfillment, connection, product-sync, and recovery flows.
- [Seller operations](./seller-operations.md) covers onboarding, catalog maintenance, orders, fulfillment, shipping, and labels.
- [Seller growth tools](./seller-growth-tools.md) covers discounts, promotional events, campaigns, retailer CRM, segments, referrals, and widgets.
- [Growth workflows](./growth-workflows.md) covers samples, sample boxes, placements, demos, messaging, and cross-audience proof.
- [Buyer lists and rewards](./buyer-lists-and-rewards.md) covers Favorites, My Brands, loyalty, volume pricing, referrals, and CSV export.
