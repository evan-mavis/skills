# Buyer lists and rewards

Buyer lists and rewards let an authenticated retailer save products and brands, manage brand relationships, review loyalty and volume-pricing progress, and invite brands for credit.

## Sub-features

- `buyer-favorite-products` saves products and shows them on `/wishlist`.
- `buyer-favorite-brands` saves brands and shows the Brands view on `/wishlist`.
- `buyer-my-brands` shows the retailer's applied, in-review, favorite, ordered, and archived brand relationships on `/account/buyer/brands`.
- `buyer-rewards` shows the programs available to the retailer on `/rewards`.
- `buyer-loyalty` shows current-month progress, available credit, and historical earnings on `/rewards/loyalty`.
- `buyer-volume-pricing` shows savings, tiers, brand progress, search, filters, sorting, and the zero state on `/rewards/volume-pricing`.
- `buyer-brand-referrals` shows the referral link, earnings summary, invitation states, and brand-invite controls on `/account/buyer/referrals`.
- `buyer-favorites-export` downloads product favorites when `wishlist-export-csv` is enabled.

## How to get to it (user POV)

- Sign in as a buyer, then choose the header button named `Open favorites` to reach `/wishlist`. On compact layouts, open the buyer menu and choose `Shop Favorites`.
- On `/wishlist`, use the controls named `Show Products` and `Show Brands`, and the searchboxes with placeholders `Search for products` and `Search for brands`.
- Open the account menu with `Open buyer account`, then choose `My Brands`, `Loyalty Credit`, `Volume Pricing`, or `Invite a Brand` when those entries are available.
- Visit `/account/buyer/brands` directly for My Brands and `/account/buyer/referrals` directly for referrals.
- Visit `/rewards` for the rewards hub, `/rewards/loyalty` for loyalty, and `/rewards/volume-pricing` for volume pricing.
- The desktop credit-balance button opens shortcuts named `Airgoods Rewards` and `Invite a Brand` when the corresponding programs are available.

## Driving it

Preconditions:

- Full mode doctor passes. Referral sends and other queued side effects also require a healthy queue worker.
- Follow `Authenticated setup` in `../SKILL.md` and use `$query-local-db` to select an active buyer with a non-null store. Confirm the selected isolated database before reading or changing data.
- Discover the current schema before querying. Record the buyer's store ID and initial rows relevant to `wishlist`, `wishlist_item`, and `buyer_brand`; for rewards also record the store's credit balance, loyalty and volume-pricing eligibility, and any volume-pricing relationships. Never print credentials or tokens.
- For a populated success drive, choose live products and brands visible in the current catalog. For a true loyalty-history state, select a loyalty-enabled store with qualifying order history. For a true volume-pricing state, select a store with enabled, non-disabled relationships to live brands.
- `buyer-loyalty` requires the selected store to have loyalty enabled.
- `buyer-volume-pricing` requires both `store.volume_pricing_enabled = true` and a non-control `volume-pricing-rollout` assignment loaded by the web client. A missing local PostHog key or unresolved flag makes the feature unavailable even when the store column is true.
- `buyer-favorites-export` requires `wishlist-export-csv` to resolve enabled. Use a buyer whose product favorites contain only test-safe data.
- Snapshot every row or field that a drive may change. Prefer read-only checks; perform a mutation only when its exact cleanup is known.

- **Open Favorites.** From a buyer page, choose `Open favorites`. Require `/wishlist`, visible title `Favorites`, role buttons `Show Products` and `Show Brands`, and searchbox `Search for products` or `Search for brands`. The initial catalog skeleton must resolve to cards or `No results fit your search!`.
- **Products view.** Choose `Show Products`. Require `Search for products`. When populated, require at least one link named `View <visible product name> wholesale product`. Fill the searchbox with a visible product name and require that result; fill it with a unique impossible term to prove the empty state, then clear the input and require the catalog to return.
- **Brands view.** Choose `Show Brands`. Require `Search for brands` and a visible brand result when the selected buyer has saved-brand state. Exercise the same matching and impossible-term searches, then clear the input.
- **Favorite mutation.** Use an existing live product or existing buyer-brand relationship selected during setup so cleanup does not leave a new relationship row. Record whether it starts saved, perform one real heart toggle, require its visual state or success toast to change, and confirm the corresponding branch-local row through a read-only query. Toggle it back and require the original database state. If the heart cannot be targeted from the accessibility snapshot, do not guess by DOM position; report the mutation unreachable and retain the read-only list proof.
- **Favorites CSV.** In Products view, when the flag is enabled, choose `Export CSV`. Require the temporary label `Exporting…`, then `Export CSV`, plus a successful network response with CSV content type and an attachment filename beginning `favorites-`. Keep downloaded evidence outside the repository and do not expose its customer data. A returned button without a successful response is not proof.
- **My Brands.** Navigate to `/account/buyer/brands`. Require visible title `My Brands`, a table, filters named `All`, `Applied`, `In Review`, `Favorites`, `Ordered`, and `Archived`, plus searchbox `Search by brand`. Select a filter backed by setup data, search for a visible brand, and require the row. Use an impossible search to require `No results found` or the account's vendor-application empty state, then press Escape in the searchbox and require rows to return.
- **My Brands mutation.** Status, rating, note, reminder, message, and sample controls persist or create external work. Leave them read-only unless specifically in scope. If a status change is authorized, record the exact starting status, choose a reversible alternate status, require `Status updated successfully!`, confirm the row under the new filter, then restore the original status and confirm it again through the UI and a read-only query.
- **Rewards hub.** Navigate to `/rewards`. Require `Airgoods Rewards`, `Earn rewards on every order`, and only the eligible cards among `Volume Pricing` and `Loyalty Credit`. A buyer eligible for neither program may show the hub copy and `Select a rewards program above to view your progress and earnings.` with no cards; record that as unavailable, not as a populated success.
- **Loyalty.** Navigate to `/rewards/loyalty` with an enrolled buyer. Require `Loyalty Credit`, `Progress this month`, `Credit earned in <current month>:`, and either the current earning-rate copy, the goal-reached copy, or the monthly-cap-exhausted copy. After loading, require either a `Historical earnings` table with `Month`, `Number of orders`, and `Loyalty credit earned`, or no history table for a valid empty history. Record `Credit available:` without changing it.
- **Loyalty unavailable state.** With a non-enrolled buyer, `/rewards/loyalty` must show `Your store is not currently enrolled in the Airgoods Loyalty program.` and return to `/rewards`; accept the message only with the observed redirect or unavailable panel.
- **Volume pricing populated state.** Navigate to `/rewards/volume-pricing`. Require `Volume Pricing`, `Total saved this year`, `Brands with progress toward savings`, `Top Brands`, `All Brands`, searchbox `Search brands...`, and buttons `Filter` and `Sort By`. Search for a visible brand, require a matching relationship card, clear with `Clear search`, change one sort option, require its sort chip to update, then restore `Tier: High to Low`. If filtering, remove every tier chip or choose `Clear all filters`.
- **Volume pricing zero state.** Use an eligible buyer with no relationships. Require `How it works`, `Start earning`, zero savings/progress, and discovery links including `Discover`, `New Arrivals`, `Best Sellers`, `Free Shipping`, and `Deals`; `Top Brands` and `All Brands` must be absent. Open the accordion button `What counts toward my yearly spend?` and require its answer, then collapse it.
- **Referrals read-only.** Navigate to `/account/buyer/referrals`. Require `Earn credit for every new brand you refer to Airgoods`, a link button whose name contains `airgoods.com/join/`, input `Enter an email address or brand name`, button `Send Invite`, `Your summary`, and a table with filters `All`, `Processing`, `Invited`, `Onboarding`, and `Joined`. Searchbox `Search by name or email` must match a visible referral or show `No results found`; clear it before finishing.
- **Referral link.** Choosing the `airgoods.com/join/<slug>` button may be used as a no-server-mutation check. Require `Copied to clipboard!` and leave `Edit` untouched. If slug editing is explicitly in scope, save the exact original slug, use a unique branch-local temporary slug, require `Slug updated successfully!`, then restore the original and confirm the displayed link.
- **Referral send safety.** Do not choose `Send Invite`, `Customize invite`, `Follow-Up`, `Verify email`, or `Message` during routine verification. They can send email, enqueue work, update third-party systems, or create persistent records. Exercise a send only with explicit authorization, a dedicated recipient controlled by the verifier, a healthy queue, and an agreed cleanup plan; database cleanup cannot recall an email or third-party event.
- **State coverage and proof.** For each selected sub-feature, capture loading before it settles, the success or intentional empty/unavailable state, and one reversible interaction cycle. On failed requests, retain the network response and report failure; do not accept a lingering skeleton, zero summary, missing card, or apparent volume-pricing zero state without a successful response. Record routes, buyer email, store ID, flag assignments, selected product/brand text, initial and final state, and cleanup confirmation in `run.txt`.

## Gotchas

- These features are authenticated and backend-dependent; none is verifiable in public-only mode.
- `/wishlist` is the user-facing Favorites page. Its Brands view can include brands inferred from saved products or brand-relationship status, so it is not a strict view of the current `following` boolean.
- Product and brand heart toggles do not currently expose stable accessible names. Use accessible list controls for read-only proof and report the toggle as unreachable when the browser snapshot cannot identify it safely.
- Adding then removing a never-before-seen brand can leave a My Brands relationship behind. For reversible follow checks, use an existing `buyer_brand` row and restore its original `following` value and status.
- A wishlist-load failure can look like a skeleton that never ends. A rewards request failure can look like missing content, and a volume-pricing request failure can resemble the zero state. Require successful responses before classifying any empty state.
- My Brands `Favorites` status and a brand's current follow state are related but not interchangeable. Do not use one as sole proof of the other.
- Loyalty and volume-pricing pages are read-only progress views. Their balances and tiers change through orders, credits, resets, or admin operations; do not manufacture those states during routine browser verification.
- Volume pricing is dual-gated by database eligibility and a client-loaded flag. Admin impersonation does not prove normal-user flag assignment.
- Admin impersonation is valid for branch-local rendering, navigation, and reversible data changes. It suppresses selected analytics and is not proof that analytics, referral email, notifications, or other intentionally skipped effects were delivered.
- Referral links require a non-empty store slug. Copying is reversible; editing the slug changes public attribution URLs and must be restored.
- Referral filters describe processing, invited, onboarding, and joined lifecycle states. Use existing rows for state coverage instead of creating real invitations.
- Search and filter state can persist in the client. Clear searches, filters, sort changes, and wishlist view selection before final proof.
- Never delete shared production-like rows for cleanup. Restore only mutations made in the isolated database, and prove the final state through both the buyer surface and a read-only query.
