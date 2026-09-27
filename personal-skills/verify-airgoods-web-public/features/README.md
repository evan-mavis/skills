# Airgoods web-public verification map

This directory is the maintained source for verifying Airgoods public, editorial, CMS, and machine-facing SEO behavior.

## Baseline preconditions

- Read `../SKILL.md`, select public-only or full mode, and pass doctor.
- Use an anonymous browser context unless authenticated chrome/handoff is the feature.
- Record direct web-public versus main-web proxied origin.
- Record Sanity/environment labels without secrets.
- Default to read-only public navigation and CMS inspection.

## Driving conventions

- Start each recipe from its named route and prerequisite state.
- Prefer ARIA roles and names; use documented `data-*` handles only when needed.
- Exercise wide and compact public chrome when relevant.
- Use browser document/CDP and HTTP evidence for metadata, robots, sitemap, and structured data.
- Cross-surface auth, search, signup, or proxy behavior also invokes `$verify-airgoods-web`.

## Proof and skip reporting

- Warn before driving an unmapped route, state, action, viewport, service, or proof requirement.
- Save non-video evidence under `<evidence-root>/verify-airgoods-web-public/<run-id>/`.
- User-visible bugs require `video_before` and `video_after`; features and improvements require `video_demo`.
- Do not record credentials, unpublished CMS content, applications, personal data, or secrets.
- Report unreachable routes with the exact missing dataset, auth, backend, or external prerequisite.

## Feature entry contract

Each feature file uses exactly four H2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it`, and `Gotchas`.

## Features

- [Public home](./public-home.md) covers landing rendering, shared public chrome, auth dialogs, customer stories, and marketplace search entry.
- [Authentication entry](./authentication-entry.md) covers sign-in, account selection, password recovery, and authenticated handoff.
- [Sell on Airgoods](./sell-on-airgoods.md) covers seller acquisition, retailer proof, signup entry, webinar, and FAQs.
- [Web-public editorial](./web-public-editorial.md) covers blog audiences, features/changelog, Discover/Order/Grow, careers, brand resources, and recovery states.
- [CMS Studio](./cms-studio.md) covers Studio access, embedded Sanity, draft preview, authoring boundaries, and revalidation.
- [SEO and metadata](./seo-and-metadata.md) covers canonical/social metadata, robots, sitemap, structured data, redirects, and not-found behavior.
