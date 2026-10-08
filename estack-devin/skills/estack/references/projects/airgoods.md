# Airgoods project context

Apply this context only to work targeting `github.com/Airgoods-Inc/airgoods`, including its worktrees and explicitly targeted PRs. Continue through poteto-mode and its selected playbook. These project requirements apply throughout implementation, review, and verification.

## Environment, verification, and PR work

For an Airgoods cloud setup request, including `/estack-devin:estack setup cloud`, read [setup-cloud-env](../../../setup-cloud-env/SKILL.md) and carry it through database and server readiness. Before work requiring a running Airgoods app in a cloud session, use that skill to resolve the handoff and start missing required services. Do not assume dependency installation started the dev servers or that Devin executed the repository bootstrap automatically. Documentation-only work does not need app startup.

For Airgoods PR babysitting, merge-ready requests, review-comment cleanup, or outstanding PR work, read [babysit-airgoods-pr](../../../babysit-airgoods-pr/SKILL.md) and use its overrides. Opening a PR alone does not trigger babysitting.

For Airgoods verification, read [verify-airgoods](../../../verify-airgoods/SKILL.md) and invoke the affected surface skills. User-visible bugs need a reproduction before editing and verification afterward. Features and improvements need a demo. Read the verifier before starting the work so its proof requirements guide the change.

Airgoods PR babysitting supersedes generic pstack and host babysitting for that task. Preserve its external GitHub Codex reviewer, required identity, review receipts, and no-merge limits. Green CI alone does not satisfy independent verification.

For verification and PR babysitting, follow [Local runtime](../../../verify-airgoods/references/local-runtime.md) and [Browser hosts and evidence](../../../verify-airgoods/references/browser-hosts.md). Reuse the configured checkout's environment and start only missing authorized app processes. Their prohibition on provisioning, previewctl, and environment teardown takes precedence over conflicting setup guidance. Do not invoke cloud setup merely to satisfy a verification prerequisite. Explicit cloud setup follows its own lifecycle skill.

The selected verifier owns the surface, feature recipe, synthetic fixtures, pass predicates, evidence path, recording, and cleanup. Read it before editing. Pass this context and the affected verifier pointers to delegates. Preserve mandatory live proof and independent review gates when tools are unavailable; report the blocker.

## Other Airgoods workflows

Use the task skill only when its workflow is requested or required by the authorized task:

- [Query local DB](../../../query-local-db/SKILL.md) and [Query production DB](../../../query-prod-db/SKILL.md) for read-only database evidence. Verify the target and keep credentials out of output.
- [Refresh local DB](../../../refresh-local-db/SKILL.md) for an authorized local refresh.
- [Provision Neon branch](../../../provision-neon-branch/SKILL.md) only for an explicit disposable-branch request. It is not normal cloud setup or verification provisioning.
- [Close release issues](../../../close-release-issues/SKILL.md) for release closeout. Preserve its audit and user-confirmation gate before changing issue states.
- [Maintain Airgoods verification](../../../maintain-airgoods-verification/SKILL.md) for maintaining the bundled verifiers. This does not authorize product or infrastructure changes.
