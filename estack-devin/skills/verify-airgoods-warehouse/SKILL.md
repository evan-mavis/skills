---
name: verify-airgoods-warehouse
description: Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill. Verify the Airgoods Warehouse operator app through the host's browser automation with recorded walkthrough evidence for user-visible changes. Use for apps/warehouse routes, internal operations, catalog, industry data, observability, admin authentication, or backend/API behavior consumed by Warehouse.
---

# Verify Airgoods Warehouse

Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill.

Read [Browser hosts and evidence](../verify-airgoods/references/browser-hosts.md) before driving. It owns host resolution, harness selection, session isolation, recording availability, and private evidence storage.

Drive the internal Next.js Warehouse app in `apps/warehouse`. Warehouse is an authenticated operator surface backed by the Airgoods backend and shared API package. Marketplace behavior belongs to `/estack-devin:verify-airgoods-web`; public-web behavior belongs to `/estack-devin:verify-airgoods-web-public`.

## Coverage gate

Before launching, name the operator job, route, account, state transition, side effect, and requested proof. Find a matching file in `features/README.md`. If no recipe covers the exact route, state, action, service, viewport, or evidence requirement, warn the user before testing and label any safe exploratory drive `unmapped`. Never turn an observed product regression into expected map behavior.

## Launch

1. Follow [Direct local runtime](../verify-airgoods/references/local-runtime.md). Reuse the existing local development environment in the current checkout. Its prohibition on previewctl, worktree provisioning, and remote previews overrides conflicting repository or setup guidance.
2. Reuse healthy backend and Warehouse processes belonging to this checkout. Start only missing apps with `pnpm --dir apps/backend dev` or `pnpm --dir apps/warehouse dev`, subject to Local runtime's lifecycle-hook guidance.
3. Use the existing configured database, Redis, ports, and API origin. Report missing prerequisites instead of generating an environment.
4. Allow for a cold Next compile before declaring Warehouse unhealthy. Start `pnpm --dir apps/backend dev:queue` only for recipes that enqueue work and when the worker is missing. Record process/session IDs and ownership.
5. Warehouse serves same-origin `/api/trpc` and proxies through the shared API package to backend; it does not need the separate mobile tRPC server.

## Doctor

Require:

- Backend `GET /api/healthcheck` returns `"message":"OK"`.
- Queue `GET /api/healthcheck` returns `"message":"OK"` when the selected feature enqueues work.
- Redis returns `PONG` when queue behavior is in scope.
- Warehouse `/login` returns successfully and `/home` either renders authenticated chrome or redirects to `/login`.
- Listener ownership and configured API origin match this checkout and runtime.

Re-run doctor before the first drive, after surprising state, after a failed action, and after restarting any service.

## Authentication

1. Read and invoke `/estack-devin:query-local-db` from its installed skill directory against the verified configured development database.
2. Discover the `"user"` schema, then select an active `Admin` user appropriate to the task. Do not use a buyer or seller account: Warehouse rejects non-admin users after login.
3. Open `/login`, fill `Email` and `Password`, and use the selected admin email with the backend's configured `ADMIN_PASSWORD` (`123` in standard local configuration, unless overridden).
4. Require final navigation to `/home` and authenticated Warehouse navigation. Do not accept `/` as the pass predicate if competing login redirects race. Never put the password, token, personal data, or session storage in evidence.

## Drive

Follow the linked browser host guide:

1. Open the resolved Warehouse origin in a run-owned tab/session, verify its auth state, and take an accessibility snapshot.
2. Use sidebar link names, page headings, form labels, and table controls from the selected feature recipe.
3. Capture the triggering action and observable result. For mutations, verify with a second operator view and read-only API/database confirmation.
4. Exercise compact and wide layouts when navigation, tables, dialogs, or responsive behavior changed.
5. After collecting proof, follow Cleanup to restore authorized mutations before closing this run's tab/session.

## Video evidence

- User-visible bugs require a recorded browser walkthrough that reproduces the defect before editing and a second walkthrough showing the same path fixed.
- Features and improvements require one concise demo walkthrough after implementation.
- Use the same admin, route, data, viewport, and discriminating action across before/after proof.
- Begin recording after authentication and fixture preparation. Never capture credentials, tokens, production-copy personal data, payment details, customer messages, addresses, or provider secrets.
- Check recording support before a required walkthrough. If no available harness can record it, report the missing recording capability as blocked proof; do not silently substitute screenshots or claim full verification.

## Evidence

Save run metadata and non-video artifacts under `<evidence-root>/verify-airgoods-warehouse/<run-id>/`. Record Git SHA, local host and checkout, Warehouse/backend/queue ports, database source label, feature ID, admin identity without secrets, starting state, exact actions, result, side effects, process ownership, and cleanup.

Keep before/after accessibility snapshots, screenshots, relevant responses, read-only state confirmation, and recorded walkthrough artifact references. Required bug entries are `video_before` and `video_after`; features and improvements use `video_demo`.

## Cleanup

1. Finalize the proof recording and confirm its artifact exists. While the services and temporary session are still available, restore authorized reversible mutations made by this run through supported product or cleanup paths and confirm the restored state. Never delete shared production-copy fixtures or claim to undo sent emails, external provider actions, CMS publications, or applications.
2. End only the temporary authentication session this run owns and close its verification tab/session; never sign out or clear another session.
3. Stop only processes this run started, using recorded process/session IDs. Leave adopted services running; never kill by process name.
4. Leave the existing database, Redis, infrastructure, environment files, and checkout untouched. This workflow does not provision or tear down environments.
5. Confirm evidence survives cleanup at its absolute path, including after a failed attempt.

Read `features/README.md` before driving. Report verified, verified-unreachable with the exact app prerequisite, failed with observed evidence, or blocked when required tooling or proof is unavailable.
