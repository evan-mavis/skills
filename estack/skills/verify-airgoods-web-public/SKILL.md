---
name: verify-airgoods-web-public
description: Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill. Verify Airgoods public web, landing, editorial, CMS, and SEO behavior through the host's browser automation with recorded walkthrough evidence. Use for apps/web-public, public chrome/auth, blog, Sanity Studio, marketing routes, careers, brand resources, metadata, redirects, or web-to-public proxy behavior.
---

# Verify Airgoods web-public

Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill.

Read [Browser hosts and evidence](../verify-airgoods/references/browser-hosts.md) before driving. It owns host resolution, harness selection, session isolation, recording availability, and private evidence storage.

Drive the public Next.js app in `apps/web-public`. Marketplace account and commerce behavior belongs to `$verify-airgoods-web`; Warehouse belongs to `$verify-airgoods-warehouse`. Shared chrome, authentication handoff, and main-web proxy changes require both public and marketplace verification.

## Coverage gate

Before launching, name the public feature, route, audience, viewport, state transition, side effect, and requested proof. Find the matching file in `features/README.md`. If no recipe covers the exact route, state, action, service, or evidence requirement, warn the user before testing and label any safe exploratory drive `unmapped`. Product regressions are reported, not rewritten as expected behavior.

## Launch

1. Follow [Direct local runtime](../verify-airgoods/references/local-runtime.md). Reuse the existing local development environment in the current checkout. Its prohibition on previewctl, worktree provisioning, and remote previews overrides conflicting repository or setup guidance.
2. Choose public-only mode for direct public rendering, blog, CMS gating, and most metadata; it needs web-public alone. Use full mode (backend + web + web-public) for proxying, careers data, marketplace search, and auth/signup handoff.
3. `apps/web-public` permits only one Next dev process per checkout because `.next/dev/lock` is shared. Reuse a healthy listener belonging to this checkout. Never build over, restart, or kill a process you did not start.
4. Start only missing apps with `pnpm --dir apps/web-public dev`, plus `pnpm --dir apps/backend dev` and `pnpm --dir apps/web dev` when full mode needs them. Follow Local runtime's lifecycle-hook guidance.
5. Use existing configured ports and API origins. Full mode needs the existing configured database and Redis; if required prerequisites are missing, report them instead of generating an environment. Record process/session IDs, origins, mode, and ownership.

## Doctor

Public-only mode requires web-public `/` to return successfully and its listener to belong to this checkout. Full mode additionally requires backend `/api/healthcheck` to return `"message":"OK"` and main web `/` to proxy or redirect successfully to web-public.

Use ports from the existing app configuration and verified listeners. Re-run doctor before the first drive, after surprising state, after failure, and after service restart.

## Authenticated setup

Anonymous public proof needs a clean browser context and must not clear a user's existing auth state. When authenticated public chrome or handoff is required:

1. Read and invoke `$query-local-db` from its installed skill directory against the verified configured development database.
2. Select an eligible buyer or seller email; use `sara@butterfieldmarket.com` only as a confirmed fallback buyer.
3. In full mode, open `/products?auth=sign-in` on main web and sign in with the configured local `ADMIN_PASSWORD` (`123` by default unless overridden).
4. Return through the intended public route and require the correct authenticated CTA/account chrome.
5. Never capture or record the password, token, cookie, private account data, or session storage.

Admin impersonation proves permitted UI and authorized state in the verified configured database, not analytics or behavior intentionally suppressed for impersonated sessions. CMS Studio has a separate password and Sanity authentication boundary defined in its feature recipe.

## Drive

Follow the linked browser host guide:

1. Open the resolved origin in a run-owned tab/session, verify its auth state, and take an accessibility snapshot.
2. Prefer the main web origin for proxy, shared auth, and marketplace handoff proof; use direct web-public for public-only proof.
3. Use ARIA roles/names and documented `data-*` handles. Exercise wide and compact public chrome when relevant.
4. Capture the triggering action and observable result. Use browser document/CDP or saved HTTP responses for machine metadata.
5. After collecting proof, follow Cleanup to restore authorized mutations before closing this run's tab/session.

## Video evidence

- User-visible bugs require recorded `video_before` and `video_after` walkthroughs on the same route, data, viewport, and action.
- Features and improvements require one concise `video_demo`.
- Begin recording after authentication and fixture preparation. Never capture credentials, tokens, drafts, personal data, applications, CMS secrets, or provider content.
- Machine-only SEO evidence uses exact head/network/structured-data artifacts; video remains required only when the changed behavior is user-visible.
- Check recording support before a required walkthrough. If no available harness can record it, report the missing recording capability as blocked proof; do not silently substitute screenshots or claim full verification.

## Evidence

Save non-video evidence under `<evidence-root>/verify-airgoods-web-public/<run-id>/`. Record Git SHA, local host and checkout, direct/proxied origin, resolved ports, full/public-only mode, dataset/environment labels without secrets, feature ID, viewport, exact actions, state, process ownership, and cleanup.

Keep before/after accessibility snapshots, screenshots, HTTP/head/JSON-LD evidence where applicable, read-only state confirmation, and recorded walkthrough artifact references.

## Cleanup

1. Finalize the proof recording and confirm its artifact exists. While the services and temporary session are still available, restore authorized reversible mutations made by this run through supported product or cleanup paths and confirm the restored state. Never delete shared production-copy fixtures or claim to undo sent emails, external provider actions, CMS publications, or applications.
2. End only the temporary authentication session this run owns and close its verification tab/session; never sign out or clear another session.
3. Stop only processes this run started, using recorded process/session IDs. Leave adopted services running; never kill by process name.
4. Leave the existing database, Redis, infrastructure, environment files, and checkout untouched. This workflow does not provision or tear down environments.
5. Confirm evidence survives cleanup at its absolute path, including after a failed attempt.

Read `features/README.md` before driving. Report verified, verified-unreachable with the exact app prerequisite, failed with observed evidence, or blocked when required tooling or proof is unavailable.
