# airgoods web-public verification map

this directory is the maintained source for verifying airgoods public, editorial, cms, and machine-facing seo behavior.

## baseline preconditions

- read `../SKILL.md`, select public-only or full mode, and pass doctor.
- use an anonymous browser context unless authenticated chrome/handoff is the feature.
- record direct web-public versus main-web proxied origin.
- record sanity/environment labels without secrets.
- default to read-only public navigation and cms inspection.

## driving conventions

- start each recipe from its named route and prerequisite state.
- prefer aria roles and names; use documented `data-*` handles only when needed.
- exercise wide and compact public chrome when relevant.
- use browser document/cdp and http evidence for metadata, robots, sitemap, and structured data.
- cross-surface auth, search, signup, or proxy behavior also invokes `$verify-airgoods-web`.

## proof and skip reporting

- warn before driving an unmapped route, state, action, viewport, service, or proof requirement.
- save non-video evidence under `<evidence-root>/verify-airgoods-web-public/<run-id>/`.
- user-visible bugs require `video_before` and `video_after`; features and improvements require `video_demo`.
- do not record credentials, unpublished cms content, applications, personal data, or secrets.
- report unreachable routes with the exact missing dataset, auth, backend, or external prerequisite.

## feature entry contract

each feature file uses exactly four h2 sections: `Sub-features`, `How to get to it (user POV)`, `Driving it`, and `Gotchas`.

## features

- [public home](./public-home.md) covers landing rendering, shared public chrome, auth dialogs, customer stories, and marketplace search entry.
- [authentication entry](./authentication-entry.md) covers sign-in, account selection, password recovery, and authenticated handoff.
- [sell on airgoods](./sell-on-airgoods.md) covers seller acquisition, retailer proof, signup entry, webinar, and faqs.
- [web-public editorial](./web-public-editorial.md) covers blog audiences, features/changelog, discover/order/grow, careers, brand resources, and recovery states.
- [cms studio](./cms-studio.md) covers studio access, embedded sanity, draft preview, authoring boundaries, and revalidation.
- [seo and metadata](./seo-and-metadata.md) covers canonical/social metadata, robots, sitemap, structured data, redirects, and not-found behavior.
