# airgoods warehouse verification map

this directory is the maintained source for verifying the internal warehouse operator experience. read this index first, then use the matching feature recipe.

## baseline preconditions

- read `../SKILL.md`, select the owned local runtime, and pass doctor.
- authenticate with an active admin user selected from the verified isolated database.
- use browser handles and recorded walkthrough artifacts following the shared browser host guide.
- default to read-only navigation, filtering, and dialog inspection.
- record exact starting state and cleanup before any financial, customer-visible, queued, bulk, or external mutation.

## driving conventions

- start each recipe from its named route and prerequisite fixture.
- prefer sidebar link names, headings, labels, roles, and table controls.
- wait for a settled success, empty, or error state; a lingering skeleton is not proof.
- for mutations, verify through a second operator read and read-only api/database query.
- cross-surface effects require the corresponding marketplace/public-web recipe too.

## proof and skip reporting

- warn before driving an unmapped route, state, action, service, viewport, or proof requirement.
- save non-video evidence under `<evidence-root>/verify-airgoods-warehouse/<run-id>/`.
- user-visible bugs require `video_before` and `video_after`; features and improvements require `video_demo`.
- redact production-copy customer, seller, payment, address, message, provider, and uploaded-file data.
- report unreachable paths with the exact missing permission, fixture, service, or external configuration.

## feature entry contract

each feature file uses exactly four h2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it`, and `Gotchas`.

## features

- [warehouse payments](./warehouse-payments.md) covers orders, invoices, transactions, reconciliation cases, and audits.
- [warehouse sample-box operations](./warehouse-sample-box-ops.md) covers boxes, autopick, applications, inventory, and product groups.
- [warehouse growth programs](./warehouse-growth-programs.md) covers promo events, placements, demos, and requests.
- [warehouse platform tools](./warehouse-platform.md) covers integration availability, gtm uploads, and enrichment backfills.
- [product catalog](./product-catalog.md) covers products, review, enrichment, filters, attributes, and categories.
- [industry data](./industry-data.md) covers retailers, brands, products, locations, vendors, pos catalog, order import, and stockist map.
- [sales reps](./sales-reps.md) covers team, assignments, overrides, commissions, and attributed orders.
- [search, recommendations, and notifications](./search-recs-and-notifications.md) covers analytics, categorization, notification observability, and close the loop.
- [warehouse authentication and olive](./auth-and-olive.md) covers login, sessions, api keys, olive kpis/logs, and intervention boundaries.
