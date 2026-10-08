# Growth workflows

Growth workflows connect retailers and sellers through samples, curated sample boxes, placements, in-store demos, and account messaging. Buyer placements and demos can also appear under the treatment retailer-home Grow tab.

## Sub-features

- `growth-samples` requests a product sample and verifies buyer/seller sample lists, detail, and tracking.
- `growth-sample-box` verifies eligibility-gated buyer picks, seller applications, box detail, and review surfaces.
- `growth-placements` verifies buyer placement setup and seller opportunity/request review.
- `growth-demos` verifies buyer demo setup and seller opportunity/request review.
- `growth-messaging` verifies inbox filtering, conversation selection, drafts, attachments, and explicitly authorized delivery.

## How to get to it (user POV)

- Buyers use `/account/buyer/samples`, `/account/buyer/box`, `/account/buyer/placements`, `/account/buyer/demos`, and `/account/buyer/messages`.
- Sellers use `/account/seller/samples`, `/account/seller/samples/box`, `/account/seller/placements`, `/account/seller/demos`, and `/account/seller/messages`.
- Treatment buyers use `/home/grow`, including placement create/edit/request and demo-request child routes.
- A brand page offering samples exposes `Request Sample`.
- Message deep links use `/account/<buyer|seller>/messages?conversationId=<id>`.

## Driving it

Preconditions:

- Full mode doctor and `Authenticated setup` pass for the audience under test.
- Use `/estack-devin:query-local-db` to select accounts with the required sample, box, placement, demo, or conversation state. Cross-audience proof needs both buyer and seller fixtures for the same entity.
- Sample Box requires `sampleBoxEligible`. Placements and demos require the audience's resolved feature flag; seller navigation also requires its availability response.
- Queue is healthy for asynchronous notifications, media, and lifecycle work. Live message delivery may require additional realtime infrastructure.

- **Samples.** From a participating brand, choose `Request Sample` and require `Request samples from <brand>`. Submit only when authorized; success is `Samples successfully requested!` plus the matching row under buyer and seller Samples. For existing samples, prefer list, detail, status, and tracking reads.
- **Sample Box.** Buyer `/account/buyer/box` and seller `/account/seller/samples/box` require heading `Sample Boxes`; about pages require `Airgoods Sample Box Program`. Buyer detail exposes `Scroll left`, `Scroll right`, and eligible brand-pick controls. Seller detail exposes `Sample box timeline`; application uses `Sample Box Application` or `Edit Sample Box Application`.
- **Buyer placements.** Require heading `Placements`, or the Grow tabs `Calendar`, `Requests`, and `Placement Setup`. Stable controls include `Make this opportunity visible to sellers`, `Expand description editor`, `Search requests`, and `Edit placement request status`.
- **Seller placements.** Require `Retailer Placements`, a card named `View placement for <retailer>`, and matching detail/request state. Missing availability must render explicit empty or unavailable copy rather than a silent partial page.
- **Buyer demos.** Require heading `Demos`, `Allow demo requests`, and `Loading demo setup` only as a transitional state. Existing requests may expose `Edit demo request status` and `Edit demo date`.
- **Seller demos.** Require heading `In-Store Demos`, the available/active/request views, and `Open demo for <retailer>`. Request submission must show its confirmation before any authorized write.
- **Messages.** Open the audience inbox, search with `Search conversations...`, exercise All/Inbox, Unread, and Starred, then select a thread or verify `No conversations found.`. Sending or attaching content is permitted only in a synthetic test thread; prove delivery from a second read or recipient account.
- **Cross-audience proof.** For an authorized mutation, capture the initiating action and receiving account's resulting state using the same branch-local entity ID.
- **Proof.** Record both account emails when applicable, entity type/ID, initial state, resolved flags, expected recipient, and queue/realtime posture. Redact personal content and contact data from screenshots and video.

## Gotchas

- Buyer Grow treatment can redirect legacy placement/demo account routes into `/home/grow`; control accounts retain account routes.
- Sample Box eligibility is account state, not a PostHog flag.
- Admin impersonation is not proof for analytics, modal persistence, Slack, notifications, feedback writes, or message unread behavior that intentionally skips impersonated sessions.
- Sample-box shipping and placement/demo lifecycle email require their queue workers. Browser success does not prove downstream jobs.
- Requesting samples, changing box picks, publishing opportunities, submitting requests, changing dates/status, and sending messages are persistent or counterparty-visible mutations.
- Never hardcode entity IDs. Select visible rows from the isolated database and restore or cancel authorized mutations.
- Never capture production-copy messages, addresses, phone numbers, uploaded media, or recipient details in recorded walkthrough artifacts.
