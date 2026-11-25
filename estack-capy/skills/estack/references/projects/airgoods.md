# Airgoods project context

Apply this context only to work targeting `github.com/Airgoods-Inc/airgoods`, including its worktrees and explicitly targeted PRs. Continue through poteto-mode and its selected playbook. These project requirements apply throughout implementation, review, and verification.

## Context sources

Before planning or editing, follow Estack's [Gather context](../../SKILL.md#gather-context) step with the [Airgoods context sources](airgoods-context-sources.md) map.

## Environment, verification, and PR work

For an Airgoods cloud setup request, read [setup-cloud](../../../setup-cloud/SKILL.md) and carry it through database and server readiness. Before work requiring a running Airgoods app in a cloud session, use that skill to resolve the handoff and start missing required services. Do not assume dependency installation started the dev servers or that the repository bootstrap ran automatically. Documentation-only work does not need app startup.

For Airgoods verification, read the repository's own verify skill to select the affected apps and journeys. If the current checkout lacks it, report that verification is unavailable. User-visible bugs need a reproduction before editing and verification afterward. Features and improvements need a demo. Read the verifier before starting the work so its proof requirements guide the change. Green CI alone does not satisfy independent verification.

For verification and PR work, reuse the configured checkout's environment and start only missing authorized app processes. Do not provision environments, use previewctl, or tear down environments; this takes precedence over conflicting setup guidance. Do not invoke cloud setup merely to satisfy a verification prerequisite. Explicit cloud setup follows its own lifecycle skill.

The selected verifier owns the surface, feature recipe, synthetic fixtures, pass predicates, required evidence, and app cleanup. When video is required, the catalog-resolved capture skill owns recording, rendering, and artifact mechanics. Keep the repository guides agent-agnostic. Read it before editing. Pass this context and the affected verifier pointers to delegates. Preserve mandatory live proof and independent review gates when tools are unavailable; report the blocker.

## iOS simulator work

Capture native `apps/mobile` screens in a Devin session by default. Fall back to Evan's MacBook iOS Simulator only when Devin is unavailable or the session fails. Either way, run iPhone 16 on the universal iOS 26.5 runtime with the x86_64 dev client under Rosetta. The ML Kit pods exclude arm64 simulators, so a plain arm64 or x86_64 boot shows a black screen.

### Devin session (default)

This needs `DEVIN_API_KEY` and `DEVIN_ORG_ID` in the environment. Never print, log, or echo either value. If either is missing, use the fallback. Every call goes to `https://api.devin.ai/v3/organizations/$DEVIN_ORG_ID` with `Authorization: Bearer $DEVIN_API_KEY`.

1. Fill the [Devin capture prompt](airgoods-devin-capture.md). Settle these before sending, because Devin stalls on them mid-run:
   - Pass one already-migrated dev child branch id for both SHAs. A fresh child of the parent lacks the PR's migrations, and the repository preflight stops the session.
   - Name a test buyer with a populated multi-brand cart and credit, or allow a fallback buyer.
   - For loading and skeleton states, ask for artificial request delays. Devin cannot time them otherwise.
2. Start with `POST /sessions` and `{ prompt, platform: "macos", title, repos: ["airgoods-inc/airgoods"], max_acu_limit: 40 }`.
3. Poll `GET /sessions/{id}` about every 2 minutes with a timer wait. The session is done when `status_detail` is `waiting_for_user`. `status` stays `running`, so never wait for a terminal status. Steer it with `POST /sessions/{id}/messages` and `{ message }`.
4. List deliverables with `GET /sessions/{id}/attachments`. Download each with `curl -L` and the bearer header from `GET /attachments/{attachment_id}/{name}`, which redirects to signed S3. `app.devin.ai/attachments` URLs return 401 to the API key.
5. Devin's PNGs are raw. Check them against `manifest.json`, then curate them into `review.json` yourself: regions, labels, and coverage.

Devin runs the backend, tRPC, web on :3000, and Metro for each SHA on its own Mac. The Devin org holds the Neon and staging secrets, so send no Capy credentials. Expect about 1.5 hours for 14 Before and After pairs.

### MacBook fallback

Find one of Evan's MacBooks online with `tools.machine.list`. Follow the Mobile verification steps in the repository's verify skill where compatible with the available tools, using the runtime above. Return evidence to the caller. Report unavailable prerequisites rather than claiming verification.

## UI review coverage

For `ui-review` on an Airgoods PR, inventory every app the diff touches: `adminpanel`, `dashboard`, `dashboard-engineering`, `mobile`, `shopify-pos`, `shopify-sales-channel`, `warehouse`, `web`, and `web-public` under `apps/`, and `packages/ui`, `packages/email-templates`, and `packages/brand` wherever their change reaches a screen or email. Set `coverage.uiPattern` to `^(apps/(adminpanel|dashboard|dashboard-engineering|mobile|shopify-pos|shopify-sales-channel|warehouse|web|web-public)|packages/(ui|email-templates|brand))/.*\.(tsx|ts|jsx|css|svg|png|webp|otf)$` so Mobile styles, theme files, and assets count. Map hooks and other logic-only files to `notUserVisible` with the reason.

Capture `apps/mobile` with the [iOS simulator work](#ios-simulator-work) method: a Devin session first, Evan's MacBook as the fallback. If neither is available, or neither can reach a surface, record each affected native item as uncovered with the reason and tell Evan in the message that hands over the round. Never mark native blocked without telling him, and never record a native waiver without his explicit word.

## Other Airgoods workflows

Use the task skill only when its workflow is requested or required by the authorized task:

- Read `.agents/skills/query-local/SKILL.md` in the Airgoods checkout for development queries or `.agents/skills/query-prod/SKILL.md` in the Airgoods checkout for production queries. Follow the repo skill for read-only database evidence. Verify the target and keep credentials out of output. If the repo skill is missing, stop database querying and report the missing prerequisite.
- For an authorized local database refresh, read `.agents/skills/refresh-local-db/SKILL.md` in the Airgoods checkout.
- For an explicit disposable-branch request, read `.agents/skills/provision-neon-branch/SKILL.md` in the Airgoods checkout. Do not use it for normal cloud setup or verification. Its parent is the configured `NEON_PARENT_BRANCH_ID`. Never write to it, and treat child data as production-copy data with limited access.
- [Close release issues](../../../close-release-issues/SKILL.md) for release closeout. Preserve its audit and user-confirmation gate before changing issue states.
- For verification maintenance, read `.agents/skills/maintain-verification/SKILL.md` in the Airgoods checkout. This does not authorize product or infrastructure changes.

If the requested repo skill is missing, report that it is unavailable in the current checkout.
