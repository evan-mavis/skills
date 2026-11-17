---
name: verify-airgoods
description: Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill. Route Airgoods live verification to the correct project-specific skill. Use whenever a task asks to verify, reproduce, demo, or prove behavior in marketplace web, public web, Warehouse, iOS Simulator, or backend behavior consumed by those surfaces.
---

# Verify Airgoods

Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill.

Choose the verification surface before launching anything. This skill routes; the selected surface skill owns runtime, authentication, feature recipes, evidence, video, and cleanup.

## Route

1. Read the task, changed paths, affected routes, and direct consumers.
2. Select:
   - `apps/web/**` or marketplace routes → `$verify-airgoods-web`
   - `apps/web-public/**`, landing, blog, CMS, or public SEO routes → `$verify-airgoods-web-public`
   - `apps/warehouse/**` or Warehouse operator routes → `$verify-airgoods-warehouse`
   - iOS Simulator → [iOS simulator workflow](references/ios-simulator.md)
3. Shared public chrome, auth handoff, marketplace search from public pages, main-web proxying, or packages used by both `apps/web` and `apps/web-public` → run `$verify-airgoods-web` and `$verify-airgoods-web-public`.
4. For `apps/backend/**`, `packages/api/**`, or shared package changes, inspect callers and route to every user-facing consumer whose behavior can change. Do not treat an API response alone as proof of a UI outcome.
5. When a change crosses marketplace/public web and Warehouse, run all affected skills. Keep their service ownership, accounts, screenshots, walkthrough videos, and pass predicates separate.
6. If no route matches, or the selected skill has no feature recipe covering the exact route, state, action, side effect, viewport, or requested proof, warn the user before testing. Name the missing map entry and label any safe exploratory drive `unmapped`.

## Rules

When investigating or verifying an Airgoods bug, read and follow `.agents/skills/query-prod/SKILL.md` in the Airgoods checkout for strictly read-only production evidence.

- Never launch two skills against the same process or database without reconciling ownership first.
- Follow [Local runtime](references/local-runtime.md): reuse the existing development environment, database, and configuration. Start only missing required apps with direct app commands. Do not invoke previewctl or `provision-local-worktree-environment`, create another worktree, or create a remote preview. Report specific missing prerequisites instead of provisioning infrastructure. This policy overrides conflicting repository or setup guidance.
- Read [Browser hosts and evidence](references/browser-hosts.md) before driving a browser. Resolve the host, use its browser harness, and preserve the selected surface's proof requirements.
- User-visible bugs require a reproduction walkthrough before editing and a fixed walkthrough afterward. Features and improvements require one demo walkthrough.
- Follow each selected skill's authentication and redaction rules. Never expose passwords, tokens, production-copy personal data, or provider secrets.
- Report one verdict per selected surface: verified, verified-unreachable with the exact app prerequisite, failed with observed evidence, or blocked when required tooling or proof is unavailable.

## Demo selected/published media proof

For demo-media lifecycle verification, use the web and Warehouse growth recipes together. Establish a published synthetic image and a saved, actually processing replacement video before checking retention. Buyer and Warehouse editors must show the selected video while refreshed seller discovery, detail, booking and newly created request snapshots still use the published image.

After real processing completes, verify public promotion and manual playback. Confirm existing requests keep their captured upload after publication changes and an explicit listing clear. Exercise default and location galleries independently, including omitted-location preservation and a location clear that leaves default media unchanged.

A video that finishes before the pending check is not pending-retention proof. If an authorized processing control is needed, verify ownership of the exact run-owned process, disclose the control, resume it and confirm cleanup. Never pause the shared queue or fabricate READY.

Use synthetic accounts with reserved example.com emails and leave other users' preview fixtures unchanged. Impersonated sessions do not prove ordinary-actor authorization. Report missing Google-source fixtures and unexercised renderer variants explicitly; a gallery-layout touch check does not prove compact controls.

## Exploratory native simulator evidence

Native push remains unmapped unless a dedicated verifier covers the requested flow. Warn before an exploratory run and keep its proof limits explicit.

- When LLDB stalls on a Rosetta simulator, check for a debugserver left by this run and a macOS Developer Tools Access dialog. Cancel the dialog and end only the identified owned orphan. Do not guess credentials, kill unrelated processes, or alter permission storage.
- Inspect screenshot pixels before publication. A transient banner can appear in a desktop screenshot or recording but be absent from a later `simctl io` PNG. Exclude empty captures. Preserve untouched desktop originals when they contain the actual banner.
- A genuine system Allow prompt used for permission-only setup does not prove the app's Enable flow. Any external setup helper needs separate approval. Terminate it before appearance capture and disclose any instrumentation that remains.
- Label local simulator injection separately from provider receipt. A visible alert does not prove registration, foreground handling, authenticated routing, or end-to-end delivery.

## Installed layout

The surface skills and [maintain-airgoods-verification](../maintain-airgoods-verification/SKILL.md) are bundled sibling directories. Use `$maintain-airgoods-verification` for verification-skill maintenance. Read their `SKILL.md` files directly if discovery has not refreshed. Browser tooling belongs in [Browser hosts and evidence](references/browser-hosts.md).
