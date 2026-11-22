# Web-public editorial

Web-public editorial helps retailers and sellers browse product updates, changelogs, marketing explanations, careers, and Airgoods brand resources through the shared public shell.

## Sub-features

- `editorial-blog-hub` covers `/blog` and retailer/seller audience selection.
- `editorial-features` covers feature indexes, search, tags, pagination, and detail pages.
- `editorial-changelog` covers changelog indexes, timelines, and detail pages.
- `editorial-value-props` covers `/discover`, `/order`, and `/grow`.
- `editorial-careers` covers `/careers` and backend-provided open roles.
- `editorial-brand-guide` covers `/brand-guide` and brand-asset download.
- `editorial-shell-states` covers responsive public chrome, loading, not-found, and recoverable error states.

## How to get to it (user POV)

- Open `/blog`, then choose `I'm a Retailer` or `I'm a Seller`.
- Audience defaults `/blog/retailer` and `/blog/seller` redirect to `/features`.
- Use `Features`, `Changelog`, and `Search...`.
- Open `/blog/<retailer|seller>/<features|changelog>/<slug>` from a visible entry.
- Open `/discover`, `/order`, `/grow`, `/careers`, or `/brand-guide` directly or through public links.

## Driving it

Preconditions:

- Full mode or healthy public-only mode passes doctor.
- Use an anonymous context. Populated editorial content needs configured Sanity; careers roles need full mode and backend.

- **Blog hub.** Require `New on Airgoods` or configured site title plus `I'm a Retailer` and `I'm a Seller`.
- **Features.** Choose retailer; require `/blog/retailer/features`, `Product Updates`, and current `Features`. Accept cards or `Features coming soon`; open a visible card and use `Back`.
- **Changelog.** Choose `Changelog`; require current navigation and timeline or explicit empty copy. Open one entry when available.
- **Search.** Require dialog `Search articles`, textbox `Search article titles`, and listbox `Search results`. Enter at least two characters, verify results or empty copy, then close.
- **Seller mirror.** Require `/blog/seller/features` and one audience-specific result or empty state.
- **Value propositions.** `/discover` → `Find products that belong on your shelves.`; `/order` → `Purchasing without the busywork.`; `/grow` → `Turn new arrivals into repeat sellers.` Each exposes `Continue exploring`.
- **Careers.** Require `Join us in transforming the food & beverage industry.` and `Open roles`, distinguishing populated, empty, and temporarily unavailable states.
- **Brand guide.** Require `Using the Airgoods brand` and `Download brand assets`; when scoped, prove the download response is a zip attachment.
- **Shell/recovery.** Verify wide `Main navigation` and compact `Airgoods menu`/`Mobile navigation`. Missing audience or slug must show `404` or `Page Not Found`; exercise `Try again` only when error occurs naturally.
- **Proof.** Record URL, audience, viewport, mode, dataset label, content state, and backend posture.

## Gotchas

- Invalid audiences and missing slugs are not-found states.
- Blog search needs at least two characters; marketplace header search is separate.
- Sanity empty content is valid only after a successful response.
- Desktop and compact controls switch at 769 px.
- Careers depends on backend independently of page shell.
- Do not submit applications, credentials, draft-mode actions, webhooks, or analytics claims.
