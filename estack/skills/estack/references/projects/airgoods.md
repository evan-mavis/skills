# Airgoods project context

Apply this context only to work targeting `github.com/Airgoods-Inc/airgoods`, including its worktrees and explicitly targeted PRs. Continue through poteto-mode and its selected playbook. These project requirements apply throughout implementation, review, and verification.

## Context sources

Before planning or editing, follow Estack's [Gather context](../../SKILL.md#gather-context) step with the [Airgoods context sources](airgoods-context-sources.md) map.

## Environment, verification, and PR work

For an Airgoods cloud setup request, including `@estack setup cloud`, read [setup-cloud](../../../setup-cloud/SKILL.md) and carry it through database and server readiness. Before work requiring a running Airgoods app in a cloud session, use that skill to resolve the handoff and start missing required services. Do not assume dependency installation started the dev servers or that Codex executed the repository bootstrap automatically. Documentation-only work does not need app startup.

For Airgoods verification, read the repository's own verify skill to select the affected apps and journeys. If the current checkout lacks it, report that verification is unavailable. User-visible bugs need a reproduction before editing and verification afterward. Features and improvements need a demo. Read the verifier before starting the work so its proof requirements guide the change. Green CI alone does not satisfy independent verification.

For verification and PR work, reuse the configured checkout's environment and start only missing authorized app processes. Do not provision environments, use previewctl, or tear down environments; this takes precedence over conflicting setup guidance. Do not invoke cloud setup merely to satisfy a verification prerequisite. Explicit cloud setup follows its own lifecycle skill.

The selected verifier owns the surface, feature recipe, synthetic fixtures, pass predicates, evidence path, recording, and cleanup. Read it before editing. Pass this context and the affected verifier pointers to delegates. Preserve mandatory live proof and independent review gates when tools are unavailable; report the blocker.

## iOS simulator work

When Airgoods work needs an iOS Simulator, use one Devin Cloud macOS session by default from Codex desktop or Codex Cloud. Read the Mobile verification steps in the repository's own verify skill before dispatching. The Codex chat owns scope, review, and integration.

## Other Airgoods workflows

Use the task skill only when its workflow is requested or required by the authorized task:

- Read `.agents/skills/query-local/SKILL.md` in the Airgoods checkout for development queries or `.agents/skills/query-prod/SKILL.md` in the Airgoods checkout for production queries. Follow the repo skill for read-only database evidence. Verify the target and keep credentials out of output. If the repo skill is missing, stop database querying and report the missing prerequisite.
- For an authorized local database refresh, read `.agents/skills/refresh-local-db/SKILL.md` in the Airgoods checkout.
- For an explicit disposable-branch request, read `.agents/skills/provision-neon-branch/SKILL.md` in the Airgoods checkout. Do not use it for normal cloud setup or verification.
- [Close release issues](../../../close-release-issues/SKILL.md) for release closeout. Preserve its audit and user-confirmation gate before changing issue states.
- For verification maintenance, read `.agents/skills/maintain-verification/SKILL.md` in the Airgoods checkout. This does not authorize product or infrastructure changes.

If the requested repo skill is missing, report that it is unavailable in the current checkout.
