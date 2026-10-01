---
name: verify-airgoods-web
description: Verify the Airgoods marketplace web app through the host's browser automation with recorded walkthrough evidence. Use for apps/web marketplace, buyer/seller account, commerce, growth, payments, integrations, or backend behavior consumed by those routes.
---

# Verify Airgoods marketplace web

Read [Browser hosts and evidence](../verify-airgoods/references/browser-hosts.md) before driving. It owns host resolution, harness selection, session isolation, recording availability, and private evidence storage.

Drive the marketplace SSR app in `apps/web`. Public landing, editorial, CMS, SEO, and public chrome belong to `$verify-airgoods-web-public`; Warehouse belongs to `$verify-airgoods-warehouse`. Shared auth, search, navigation, or proxy changes require both marketplace and public verification.

## Coverage gate

Before launch, name the feature, route, audience, state transition, side effect, viewport, and requested proof. Find the matching recipe in `features/README.md`. Warn before testing when coverage is missing; label any safe exploratory drive `unmapped`. Never weaken video or side-effect proof, and never rewrite a product regression as expected behavior.

## Launch

1. Follow [Direct local runtime](../verify-airgoods/references/local-runtime.md). Reuse the existing local development environment in the current checkout. Its prohibition on previewctl, worktree provisioning, and remote previews overrides conflicting repository or setup guidance.
2. Reuse healthy backend/web processes belonging to this checkout. Start only a missing app with `pnpm --dir apps/backend dev` or `pnpm --dir apps/web dev`, subject to the lifecycle-hook guidance in Local runtime.
3. Use the existing configured database, Redis, ports, and API origins. If a required prerequisite is unavailable, report it instead of generating an environment.
4. Start `pnpm --dir apps/backend dev:queue` only when the selected recipe needs asynchronous behavior and the worker is missing. Record process/session IDs and ownership.
5. Start web-public only when `$verify-airgoods-web-public` is also selected for a shared/proxied flow.

## Doctor

Require backend `/api/healthcheck` to return `"message":"OK"` and web to serve the selected marketplace route. When queue is in scope, require queue `/api/healthcheck` to return `"message":"OK"` and Redis to return `PONG`.

Use the existing app configuration and verified listener ports; confirm the listeners belong to this Git root. Re-run doctor before the first drive, after surprising state, after failure, and after service restart.

## Authenticated setup

Use this setup for buyer, seller, cart, checkout, account, and signed-in home verification:

1. Read and invoke `$query-local-db` from its installed skill directory against the verified configured backend environment.
2. Run `--show-source`, discover schema, and select a small set of active users with the required `user_type` and non-null buyer `store_id` or seller `supplier_id`.
3. If no better feature-specific buyer exists, confirm and use `sara@butterfieldmarket.com`.
4. Open `/products?auth=sign-in` and sign in with the selected email plus configured `ADMIN_PASSWORD` (`123` by default unless overridden).
5. Require admin impersonation and expected buyer/seller chrome. Never record passwords, tokens, session storage, or private account data.

Admin impersonation proves permitted UI and reversible branch-local state. It is not proof for analytics, notifications, feedback, provider calls, or behavior intentionally suppressed for impersonated sessions.

## Drive

1. Follow the linked browser host guide to open the resolved web origin in a run-owned tab/session, verify its auth state, and take an accessibility snapshot.
2. Use route, ARIA, label, role, and documented `data-*` handles from the selected recipe.
3. Perform the real user action and wait for an observable route, UI, network, or state result.
4. For mutations, verify with a second user-facing read and read-only API/database confirmation.
5. Exercise compact and wide layouts when navigation, tables, dialogs, or responsive behavior changed.
6. After collecting proof, follow Cleanup to restore authorized mutations before closing this run's tab/session.

## Video evidence

- User-visible bugs require recorded `video_before` and `video_after` walkthroughs on the same account, route, data, viewport, and action.
- Features and improvements require one concise `video_demo`.
- Begin recording after authentication and fixture preparation. Never capture credentials, personal data, addresses, messages, payment details, provider secrets, or unrelated setup.
- Check recording support before a required walkthrough. If no available harness can record it, report the missing recording capability as blocked proof; do not silently substitute screenshots or claim full verification.

## Evidence

Save non-video evidence under `<evidence-root>/verify-airgoods-web/<run-id>/`. Record Git SHA, local host and checkout, resolved ports, database source label, feature ID, account audience, exact actions, initial/final state, process ownership, and cleanup.

Keep before/after accessibility snapshots, screenshots, relevant network/API evidence, read-only state confirmation, and recorded walkthrough artifact references.

## Cleanup

1. Finalize the proof recording and confirm its artifact exists. While the services and temporary session are still available, restore authorized reversible branch-local mutations through supported product or cleanup paths and confirm the restored state. Never delete shared production-copy fixtures or claim to undo sent emails, external provider actions, CMS publications, or applications.
2. End only the temporary authentication session this run owns and close its verification tab/session; never sign out or clear another session.
3. Stop only processes this run started, using recorded process/session IDs. Leave adopted services running; never kill by process name.
4. Leave the existing database, Redis, infrastructure, environment files, and checkout untouched. This workflow does not provision or tear down environments.
5. Confirm evidence survives cleanup at its absolute path, including after a failed attempt.

Read `features/README.md` before driving. Report verified, verified-unreachable with the exact app prerequisite, failed with observed evidence, or blocked when required tooling or proof is unavailable.
