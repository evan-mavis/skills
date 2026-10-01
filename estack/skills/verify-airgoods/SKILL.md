---
name: verify-airgoods
description: Route Airgoods live verification to the correct project-specific skill. Use whenever a task asks to verify, reproduce, demo, or prove behavior in marketplace web, public web, Warehouse, or backend behavior consumed by those surfaces.
---

# Verify Airgoods

Choose the verification surface before launching anything. This skill routes; the selected surface skill owns runtime, authentication, feature recipes, evidence, video, and cleanup.

## Route

1. Read the task, changed paths, affected routes, and direct consumers.
2. Select:
   - `apps/web/**` or marketplace routes → `$verify-airgoods-web`
   - `apps/web-public/**`, landing, blog, CMS, or public SEO routes → `$verify-airgoods-web-public`
   - `apps/warehouse/**` or Warehouse operator routes → `$verify-airgoods-warehouse`
3. Shared public chrome, auth handoff, marketplace search from public pages, main-web proxying, or packages used by both `apps/web` and `apps/web-public` → run `$verify-airgoods-web` and `$verify-airgoods-web-public`.
4. For `apps/backend/**`, `packages/api/**`, or shared package changes, inspect callers and route to every user-facing consumer whose behavior can change. Do not treat an API response alone as proof of a UI outcome.
5. When a change crosses marketplace/public web and Warehouse, run all affected skills. Keep their service ownership, accounts, screenshots, walkthrough videos, and pass predicates separate.
6. If no route matches, or the selected skill has no feature recipe covering the exact route, state, action, side effect, viewport, or requested proof, warn the user before testing. Name the missing map entry and label any safe exploratory drive `unmapped`.

## Rules

- Never launch two skills against the same process or database without reconciling ownership first.
- Follow [Local runtime](references/local-runtime.md): use the existing manually configured development environment and direct app commands. Do not invoke previewctl or a worktree provisioning helper.
- Read [Browser hosts and evidence](references/browser-hosts.md) before driving. Resolve the host, use its browser harness, and preserve the selected surface's proof requirements.
- User-visible bugs require a reproduction walkthrough before editing and a fixed walkthrough afterward. Features and improvements require one demo walkthrough.
- Follow each selected skill's authentication and redaction rules. Never expose passwords, tokens, production-copy personal data, or provider secrets.
- Report one verdict per selected surface: verified, verified-unreachable with the exact app prerequisite, failed with observed evidence, or blocked when required tooling or proof is unavailable.

## Installed layout

The surface skills and `$maintain-airgoods-verification` are bundled sibling directories. Read their `SKILL.md` files directly if discovery has not refreshed. Browser tooling belongs in [Browser hosts and evidence](references/browser-hosts.md).
