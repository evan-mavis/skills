# Product catalog

Product catalog lets operators inspect catalog health, review products and enrichment, browse filters and attributes, and understand category structure.

## Sub-features

- `catalog-hub` covers `/home/product-catalog`.
- `catalog-products` covers product list and detail.
- `catalog-review` covers ready/completed review queues and review detail.
- `catalog-enrichment` covers enrichment run lists and job detail.
- `catalog-filters` covers taxonomies, values, merge/delete boundaries, and cleanup previews.
- `catalog-attributes` and `catalog-categories` cover read-oriented browsing.

## How to get to it (user POV)

- Choose Catalog and its children `Review`, `Products`, `Filters`, `Attributes`, `Enrichment Runs`, or `Categories`.
- Product routes use `/home/product-catalog/products/<productId>`.
- Review routes use `/home/product-catalog/review/<productId>`.
- Enrichment jobs use `/home/product-catalog/runs/<jobId>`; legacy product-enrichment routes may redirect.
- Filter and attribute detail routes nest their type and ID under the corresponding index.

## Driving it

Preconditions:

- Warehouse doctor and admin authentication pass.
- Use `/estack-devin:query-local-db` to select product, review, enrichment, filter, attribute, or category fixtures matching the requested state.
- Queue/provider health is required for enrichment, indexing, cleanup apply, scrape, or retry actions. Record initial state before opening mutation controls.

- **Hub.** Require heading `Catalog` and cards for Products, Filters & Taxonomies, Attribute Browser, Categories, Enrichment Runs, and Review Queue. `Refresh metrics` is a mutation; avoid it unless scoped.
- **Products.** Require heading `Products`, settled pagination/filter state, and rows or explicit empty/error state. Open one product detail and inspect identity, variants, completeness, index health, and enrichment state. Do not enrich, reindex, or bulk-update by default.
- **Review.** Require `Review products`, `Ready to review`, and `Completed`. Open a ready item and require `Packaging evidence` and `Review decisions`. Do not save, apply, or retry review work without an exact rollback.
- **Enrichment.** Require `Enrichment runs`, status badges, and jobs or a settled empty state. Open one job; do not launch or cancel work during routine verification.
- **Filters.** Require `Filters`, browse one type and value, and inspect `Audit history` or cleanup preview where available. Merge, delete, visibility, and cleanup apply are destructive; stop before confirmation.
- **Attributes and categories.** Require `Attributes` or `Category Explorer`; drill into one attribute or expand one category node without editing.
- **Proof.** Record product/job/type/value IDs, initial statuses, queue/provider posture, selected filters, and result. Any catalog mutation also requires marketplace proof through `/estack-devin:verify-airgoods-web`.

## Gotchas

- Legacy enrichment URLs can redirect to the canonical review or run routes.
- Review save/apply, enrichment launch/cancel, indexing, filter merge/delete, visibility, and cleanup apply can change customer-visible catalog data.
- Product and review lists are paginated and filtered; preserve inherited URL state.
- A successful queue submission is not proof of completed enrichment or indexing.
- Never capture raw packaging evidence, supplier-sensitive metadata, internal model reasoning, or production-copy product media in walkthrough artifacts.
