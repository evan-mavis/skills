---
{name: maintain-airgoods-verification,description: "Maintains the Airgoods surface verifiers and router in the canonical skills repository by applying the bundled maintain-verification-skill workflow with local overrides. Use when the user asks to audit, refresh, or maintain Airgoods verification maps."}
---

# Maintain Airgoods verification

This is a thin adapter over the bundled `$maintain-verification-skill`, derived from pstack.

## Base workflow

Before doing any work, read `../maintain-verification-skill/SKILL.md` from this package in full and follow its current workflow verbatim except for the overrides below. Return `blocked` when the bundled base skill cannot be read. Its index hygiene, parallel read-only source wave, reconciliation, complete coordinator-owned live pass, triage, invariants, cleanup, and `clean` / `changed` / `blocked` outcome definitions remain authoritative.

Do not copy the base workflow into this skill. Non-conflicting changes to the bundled maintainer apply automatically.

## Overrides

1. **Target location.** The active Airgoods repository is read-only source evidence. The editable targets are the editable skill sources under `estack/skills/` in the skills repository at `~/Documents/skills`:
   - `verify-airgoods-web`
   - `verify-airgoods-web-public`
   - `verify-airgoods-warehouse`
   - `verify-airgoods`

   Never edit installed copies under `~/.codex/skills`, `~/.agents/skills`, or Codex plugin caches. Those are installed destinations; editing one creates drift that the next installation or update discards.
2. **Local-only execution.** Run in a local session that can read and write the skills repository. If it is unavailable or read-only, return `blocked`; do not assume remote edits sync to this machine.
3. **Target selection.** Apply the complete base maintenance pass separately to the three surface verifiers, serially in the order listed above. Source readers within each surface still run concurrently. Afterward reconcile the router against all three.
4. **Edit scope.** Edit only those four verifier directories and the harness files they own. Carry shared fixes into the corresponding verifier files in all three variants under the repository synchronization rules. Preserve native browser differences. Never edit Airgoods product code, repository configuration, Git history, plugin caches, settings, or unrelated skills.
5. **Canonical sources.** Keep surface skills and feature maps free of runtime-specific calls and paths. Browser tooling belongs in `verify-airgoods/references/browser-hosts.md`; preserve the shared source instead of forking a surface skill or adding runtime branches to a feature map.
6. **Delivery.** For `changed`, write and verify the canonical repository files, then run `bun scripts/check-estack.mjs`, `bun scripts/check-estack.mjs devin`, and `bun scripts/check-estack.mjs factory` from the skills repository. For Codex changes, also run `bun scripts/check-estack-loader.mjs`. Do not install plugins as part of maintenance. Report that installed account or marketplace copies need an update. Leave changes uncommitted for the user to review; do not create a branch, commit, or pull request.
7. **Run notes.** Keep scratch notes and maintenance evidence under `<evidence-root>/maintain-airgoods-verification/<run-id>/`, outside both repositories, resolving `<evidence-root>` per `verify-airgoods/references/browser-hosts.md`. Preserve them through cleanup. Use the browser and evidence guide owned by `verify-airgoods`; unavailable mandatory proof blocks a complete maintenance verdict.
8. **Runtime policy.** Preserve the user's no-previewctl workflow. Follow `verify-airgoods/references/local-runtime.md`: reuse the configured development environment and start only missing app processes. Do not reintroduce provisioning helpers or environment teardown from upstream instructions.

## Compatibility rule

When the base workflow and an override conflict, use the override only for that conflict. Everything else comes from the base workflow. If the installed base skill is unavailable or cannot be read, return `blocked` rather than reconstructing it from memory.
