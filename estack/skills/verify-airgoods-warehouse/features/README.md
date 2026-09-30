# Airgoods Warehouse verification map

This directory is the maintained source for verifying the internal Warehouse operator experience. Read this index first, then use the matching feature recipe.

## Baseline preconditions

- Read `../SKILL.md`, select the owned local runtime, and pass doctor.
- Authenticate with an active Admin user selected from the verified isolated database.
- Use browser handles and recorded walkthrough artifacts following the shared browser host guide.
- Default to read-only navigation, filtering, and dialog inspection.
- Record exact starting state and cleanup before any financial, customer-visible, queued, bulk, or external mutation.

## Driving conventions

- Start each recipe from its named route and prerequisite fixture.
- Prefer sidebar link names, headings, labels, roles, and table controls.
- Wait for a settled success, empty, or error state; a lingering skeleton is not proof.
- For mutations, verify through a second operator read and read-only API/database query.
- Cross-surface effects require the corresponding marketplace/public-web recipe too.

## Proof and skip reporting

- Warn before driving an unmapped route, state, action, service, viewport, or proof requirement.
- Save non-video evidence under `<evidence-root>/verify-airgoods-warehouse/<run-id>/`.
- User-visible bugs require `video_before` and `video_after`; features and improvements require `video_demo`.
- Redact production-copy customer, seller, payment, address, message, provider, and uploaded-file data.
- Report unreachable paths with the exact missing permission, fixture, service, or external configuration.

## Feature entry contract

Each feature file uses exactly four H2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it`, and `Gotchas`.

## Features

- [Warehouse payments](./warehouse-payments.md) covers orders, invoices, transactions, reconciliation cases, and audits.
- [Warehouse sample-box operations](./warehouse-sample-box-ops.md) covers boxes, autopick, applications, inventory, and product groups.
- [Warehouse growth programs](./warehouse-growth-programs.md) covers promo events, placements, demos, and requests.
- [Warehouse platform tools](./warehouse-platform.md) covers integration availability, GTM uploads, and enrichment backfills.
- [Product catalog](./product-catalog.md) covers products, review, enrichment, filters, attributes, and categories.
- [Industry data](./industry-data.md) covers retailers, brands, products, locations, vendors, POS catalog, order import, and stockist map.
- [Sales reps](./sales-reps.md) covers team, assignments, overrides, commissions, and attributed orders.
- [Search, recommendations, and notifications](./search-recs-and-notifications.md) covers analytics, categorization, notification observability, and Close the Loop.
- [Warehouse authentication and Olive](./auth-and-olive.md) covers login, sessions, API keys, Olive KPIs/logs, and intervention boundaries.
