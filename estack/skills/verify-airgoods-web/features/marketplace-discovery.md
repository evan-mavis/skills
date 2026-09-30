# Marketplace discovery

Marketplace discovery lets a visitor browse wholesale products or brands, filter the catalog, and open a detail page backed by the local API and isolated database.

## Sub-features

- `marketplace-products` loads the wholesale specialty product catalog.
- `marketplace-brands` switches to the brand catalog.
- `marketplace-search` applies a public-header or marketplace search query.
- `marketplace-detail` opens a visible product or brand result.

## How to get to it (user POV)

- Visit `/products` for the product catalog.
- Visit `/brands` for the brand catalog.
- Submit `Search Airgoods` from the public header.
- Choose a visible product or brand card to open its detail page.

## Driving it

Preconditions:

- Full mode doctor passes for backend, web, and web-public.
- The isolated Neon branch contains marketplace data.

- **Load products.** Navigate to `/products` on the resolved web URL. Require a heading containing `Wholesale Specialty Products`, the `Show Brands` control, the `Show Products` control, and at least one catalog result.
- **Switch to brands.** Choose the button named `Show Brands`. Require the heading to contain `Wholesale Specialty Brands` and brand results to replace product results.
- **Return to products.** Choose `Show Products`. Require `Wholesale Specialty Products` and product results.
- **Search.** Fill `#header-search` with a term taken from an existing result and choose `Submit search`. Require `?search=<term>` and the matching result to remain visible. Use `Clear search` to restore the unfiltered catalog.
- **Open detail.** Choose one visible result link. Require navigation to `/product/<id-slug>` or `/brand/<id-slug>` and a heading matching the selected result.
- **Proof.** Capture the catalog before the toggle and the resulting brand or product state after it. Record the selected result text and final URL in `run.txt`.

## Gotchas

- This feature is not verifiable in public-only mode.
- The database is production-like but branch-local; never hardcode a product, brand, or UUID. Select a result visible during the run.
- Catalog requests can take longer while Neon compute wakes. Wait for results or the explicit unavailable state, not a fixed delay.
- `Show Brands` and `Show Products` are ARIA buttons implemented on non-button elements; target their role and accessible name.
- Desktop search uses `#header-search`; mobile uses `#header-search-mobile`. Both expose `Submit search` and `Clear search`.
- An empty catalog is not proof of successful browsing. Record it as blocked unless the selected filter intentionally has no results.
