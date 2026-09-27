---
name: maintain-airgoods-verification
description: Maintains the Airgoods surface verifiers and router in the canonical skills repository by applying pstack's current maintain-verification-skill workflow with local overrides, then syncing every installed copy. Use when the user asks to audit, refresh, or maintain Airgoods verification maps.
disable-model-invocation: true
---

# Maintain Airgoods verification

This is a thin adapter over pstack's `$maintain-verification-skill`.

## Base workflow

Before doing any work, locate the installed pstack-for-codex plugin's `skills/maintain-verification-skill/SKILL.md` (use the live skill catalog, or inspect `~/.codex/plugins/cache/pstack-for-codex-local/pstack-for-codex/` when needed), read it in full and follow its current workflow verbatim except for the overrides below. The base skill ships with the pstack plugin, so this adapter requires a host where that plugin is installed; return `blocked` when it cannot be read. Its index hygiene, parallel read-only source wave, reconciliation, complete coordinator-owned live pass, triage, invariants, cleanup, and `clean` / `changed` / `blocked` outcome definitions remain authoritative.

Do not copy the base workflow into this skill. Future non-conflicting changes to pstack's maintainer apply automatically.

## Overrides

1. **Target location.** The active Airgoods repository is read-only source evidence. The editable targets are the canonical skill sources in the skills repository at `~/Documents/skills`:
   - `verify-airgoods-web`
   - `verify-airgoods-web-public`
   - `verify-airgoods-warehouse`
   - `verify-airgoods`

   Never edit an installed copy under `~/.codex/skills`, `~/.cursor/skills`, `~/.agents/skills`, or a host's agent store. Those are sync destinations; editing one creates drift that the next sync silently discards.
2. **Local-only execution.** Run in a local session that can read and write the skills repository. If it is unavailable or read-only, return `blocked`; do not assume remote edits sync to this machine.
3. **Target selection.** Apply the complete base maintenance pass separately to the three surface verifiers, serially in the order listed above. Source readers within each surface still run concurrently. Afterward reconcile the router against all three.
4. **Edit scope.** Edit only those four verifier directories and the harness files they own. Never edit Airgoods product code, repository configuration, Git history, plugin caches, settings, or unrelated skills.
5. **Host neutrality.** These verifiers are shared by every host. Keep surface skills and feature maps free of host names, harness calls, and host-specific paths. A host difference belongs in `verify-airgoods/references/browser-hosts.md`; never fork a surface skill or add a host-conditional branch to a feature map.
6. **Delivery.** For `changed`, write and verify the repository files, then run `./scripts/sync-skills.sh` from the skills repository to refresh the installed copies, and confirm `./scripts/sync-skills.sh --check` reports no drift. This family is personal-only, so never run the marketplace sync for it. The install sync reconciles every manifest entry, so report anything it installs beyond this family rather than letting it pass unreviewed. Leave the changes uncommitted for the user to review; do not create a branch, commit, or pull request.
7. **Run notes.** Keep scratch notes and maintenance evidence under `<evidence-root>/maintain-airgoods-verification/<run-id>/`, outside both repositories, resolving `<evidence-root>` per `verify-airgoods/references/browser-hosts.md`. Preserve them through cleanup. Use the browser and evidence guide owned by `verify-airgoods`; unavailable mandatory proof blocks a complete maintenance verdict.
8. **Runtime policy.** Preserve the user's no-previewctl workflow. Follow `verify-airgoods/references/local-runtime.md`: reuse the configured development environment and start only missing app processes. Do not reintroduce provisioning helpers or environment teardown from upstream instructions.

## Compatibility rule

When the base workflow and an override conflict, use the override only for that conflict. Everything else comes from the base workflow. If the installed base skill is unavailable or cannot be read, return `blocked` rather than reconstructing it from memory.
