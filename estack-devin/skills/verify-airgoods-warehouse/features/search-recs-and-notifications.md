# Search, recommendations, and notifications

These observability surfaces let operators inspect marketplace search and recommendation quality, categorization coverage, and notification delivery health.

## Sub-features

- `search-recs-analytics` covers KPI and behavior tabs under `/home/search-recs-analytics`.
- `search-categorization` covers categorization coverage and guarded sync/backfill actions.
- `notification-observability` covers KPI, health, retailer history, trend, and filter views.
- `close-the-loop` covers customer-request notification review without sending unless authorized.

## How to get to it (user POV)

- Choose Search & Recs → `Analytics` or `Search`.
- Use `/home/search-recs-analytics` and `/home/search-recs-analytics/categorization`.
- Open `/home/notification-observability` directly for notification dashboards.
- Choose Notifications → `Close the Loop` for `/home/emails/close-the-loop`, then open a notification detail.

## Driving it

Preconditions:

- Warehouse doctor and admin authentication pass.
- Use `/estack-devin:query-local-db` only when a specific query, retailer, notification, or request fixture is needed.
- Queue and delivery-provider health are required before proving notification send/delivery. Analytics dashboards are read-oriented.

- **Search and recommendations.** Require `Search & Recommendations Analytics` and applicable KPI, Search, Filters, Sliders & Recs, Engagement, ATC, Order Data, Representation, or Data Gaps tabs. Exercise two relevant tabs and require charts/tables or an explicit empty/error state.
- **Categorization.** Require `Search Categorization` and current coverage. Do not choose embedding sync, enrichment sync, or backfill actions during routine verification.
- **Notification observability.** Open the direct route and require `Notification Observability`, navigation `Notification Observability Views`, and KPI, Health, Retailer History, and Trends. Use `Dashboard filters`, apply one reversible date/channel filter, and restore it.
- **Close the Loop.** Require the request list and open one detail. Inspect recipient, issue, and action state without sending. Any email action requires synthetic recipients, explicit authorization, and provider-level proof.
- **Proof.** Record time range, tab, filters, successful response, selected notification/request ID, queue/provider posture, and settled state. Do not infer delivery from enqueue or dashboard totals alone.

## Gotchas

- Notification observability is a real route but is not linked by the current sidebar; Notifications links only Close the Loop.
- Sync, enrichment, and backfill controls can launch expensive bulk work.
- Dashboard empty states can reflect filters or delayed data rather than system health.
- Close-the-Loop send actions contact real recipients unless a test-safe fixture is used.
- Never expose search text tied to identifiable users, retailer history, recipient addresses, notification contents, or delivery-provider payloads in evidence.
