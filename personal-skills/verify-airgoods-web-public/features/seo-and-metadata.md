# SEO and metadata

SEO and metadata makes Airgoods public and editorial routes discoverable with correct canonical URLs, social previews, robots policy, sitemap entries, structured data, redirects, and not-found behavior.

## Sub-features

- `seo-landing` covers metadata and structured data for public marketing routes.
- `seo-blog` covers hub, audience indexes, details, pagination, and tag policy.
- `seo-robots` covers `/blog/robots.txt`.
- `seo-sitemap` covers `/blog/sitemap.xml`.
- `seo-structured-data` covers website, organization, article, breadcrumb, FAQ, and return-policy JSON-LD.
- `seo-routing` covers audience redirects and missing audience/slug behavior.

## How to get to it (user POV)

- Public routes include `/`, `/discover`, `/order`, `/grow`, `/sell-on-airgoods`, `/careers`, and `/brand-guide`.
- Editorial routes include `/blog`, audience Features/Changelog indexes, and slug details.
- Machine routes include `/blog/robots.txt`, `/blog/sitemap.xml`, and generated Open Graph images.
- Valid audience roots redirect to `/features`; invalid audiences or missing slugs render not found.

## Driving it

Preconditions:

- Web-public is healthy. Record direct versus proxied origin, configured `SITE_URL`, and Sanity dataset labels without secrets.
- Populated article metadata and sitemap entries require published Sanity content.

- **Metadata.** Inspect each changed document head and require one canonical URL, title, description, Open Graph, and Twitter fields appropriate to the page.
- **Landing structured data.** Require only page-appropriate Website, Organization, MerchantReturnPolicy, or FAQPage JSON-LD.
- **Blog structured data.** Hub requires website/organization data; article details require BlogPosting and BreadcrumbList matching visible content.
- **Indexes.** Pagination may be canonical; tag-filtered indexes must be noindex/follow.
- **Robots.** Read `/blog/robots.txt`; local/development commonly disallows indexing while production follows deployment policy.
- **Sitemap.** Read `/blog/sitemap.xml`; require static hub/index routes plus current published entries with absolute configured URLs.
- **Routing.** Require retailer/seller audience roots to redirect to Features. Invalid audience, missing slug, and invalid pagination must show `404` or `Page Not Found`.
- **Proof.** Use browser document/CDP and saved HTTP response evidence for head, redirect, robots, sitemap, and JSON-LD. Apply video only to user-visible route behavior.

## Gotchas

- The app has no Next base path; `/blog` is a normal route folder.
- Canonical URLs follow configured Airgoods origin, not local address.
- Missing Sanity content, unpublished content, and true not-found are different states.
- Local robots disallow is expected.
- Tag filters are deliberately noindex.
- Screenshots are weak metadata proof; retain exact values.
- Do not fire revalidation or expose unpublished CMS content.
