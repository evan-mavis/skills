# Industry data

Industry data lets operators inspect and reconcile retailers, brands, products, locations, vendors, POS catalogs, imported orders, and stockist-map pipeline results.

## Sub-features

- `industry-core` covers the hub plus retailer, brand, product, location, and vendor records.
- `industry-pos-catalog` covers catalog runs and match review.
- `industry-order-import` covers import runs, jobs, and matches.
- `industry-stockist-map` covers data entries, pipeline runs, and detail.

## How to get to it (user POV)

- Choose `Industry` for `/home/industry`, then Retailers, Brands, Products, POS Catalog, Order Import, or Stockist Map.
- Retailer and brand details use `/home/industry/retailers/<id>` and `/home/industry/brands/<id>`.
- Locations use `/home/industry/locations` and `/home/industry/locations/<id>` by direct route.
- Vendors use `/home/industry/vendors`.
- POS catalog, order import, and stockist map expose run and match/detail child routes.

## Driving it

Preconditions:

- Warehouse doctor and admin authentication pass.
- Use `/estack-devin:query-local-db` to select the smallest matching industry entity, run, or match fixture.
- Queue/provider health is required for scraping, imports, retries, review apply, and pipeline work. Default to read-only.

- **Hub.** Require `Industry Data` and its domain cards. Open one domain and preserve return state.
- **Retailers and locations.** Require `Retailers` or `Locations`, rows or explicit empty/error state, then open one detail. `Add Retailer with Initial Location`, CRUD, scrape, and location-product changes are mutations.
- **Brands, products, and vendors.** Require the matching heading and rows. Products must expose `Products` and `Variants` views where available. Open detail/read state only; do not scrape, create, update, or delete.
- **POS catalog.** Require `POS Catalog`, `Catalog runs`, and runs or explicit empty state. Open one run and `Match #<id>` when available. Do not submit match review or retry.
- **Order import.** Require `Order Import`, `Import runs`, and one job/match detail when fixtures exist. Review and linking actions require explicit scope.
- **Stockist map.** Require `Stockist Map`, switch Data/Runs, and open one entry or run. Pipeline/scrape actions are queued external mutations.
- **Proof.** Record entity/run/match IDs, source, initial review status, selected tabs/filters, and queue/provider posture. Cross-surface entity changes require marketplace evidence.

## Gotchas

- Locations are real routes but may not appear as a top-level Industry card; use the direct route when needed.
- Scraping, match review, retry, CRUD, linking, and pipeline actions can update many rows or external systems.
- A branch-local database does not sandbox upstream POS, import, map, or scraping providers.
- Preserve filters and tabs when comparing list/detail behavior.
- Never expose retailer locations, vendor contacts, provider payloads, imported order data, or stockist evidence in screenshots or video.
