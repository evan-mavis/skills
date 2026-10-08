---
name: setup-droid
description: Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill. Set up or resume Airgoods on a persistent Factory Droid Computer. Use for setup droid or an explicit Factory computer setup request. Reuse one durable Neon child per computer, install missing prerequisites, start services, and verify readiness.
---

# Set up an Airgoods Droid Computer

Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill.

Prepare the selected persistent Factory computer. Run this workflow on that computer, not on the caller's desktop or an ephemeral Cursor, Codex, or Devin session. Creating a computer is a separate request. If using a remote control tool, verify the target and working directory before any command.

## Resolve the computer and repository

Read the Airgoods checkout's applicable instructions, `.cursor/README.md`, `.cursor/environment.json`, and its install and terminal scripts. Resolve the repository from its Git remote. Confirm it is `github.com/Airgoods-Inc/airgoods`.

Use Factory's computer list or trusted session metadata to resolve the stable computer ID. A hostname or display name alone is insufficient. Do not use a custom droid profile's name as machine identity. Key persistent state by computer ID and repository identity. One computer shares one Airgoods development branch across its sessions and worktrees; coordinate mutations and migrations rather than claiming per-task isolation.

Store state outside the checkout under `${XDG_STATE_HOME:-$HOME/.local/state}/estack/airgoods-droid/<computer-id>/`. Keep the directory mode 0700 and the credential and metadata files mode 0600. Record computer ID, repository, project ID, parent ID, branch ID/name, database, endpoint, creation time, and available source snapshot evidence in `branch.json`. Keep credentials only in `database.env`, never in metadata, conversation, Git, or logs. Write a safely shell-quoted `export DATABASE_URL=...` assignment so apps and query helpers inherit it after sourcing.

## Reconcile the durable Neon branch

Read [Airgoods configuration](../provision-neon-branch/references/airgoods-configuration.md) for the project and protected production-copy parent. Its disposable-branch TTL and namespace apply to that skill, not this persistent lifecycle. Require runtime Neon credentials and inspect the live CLI/API schema before use. Do not change parent protection or project settings.

Use the deterministic branch name `factory-droid-<computer-id>`, with the verified ID sanitized to lowercase letters, numbers, and hyphens. Serialize setup for this computer with an exclusive lock in its state directory. If another setup is active, wait with a bounded timeout or report it; never run a second provisioner. Recover a stale lock only after proving its owner is no longer running.

Before any create operation, reconcile local metadata with a complete branch listing in the configured project:

- Existing metadata and branch. Verify the computer/repository ownership, exact project and protected parent, direct child relationship, database, and endpoint through Neon. Require the branch to differ from the parent and have no expiration. Reuse it and retrieve its connection string privately if credentials are missing.
- No metadata and exactly one matching branch. Recover only after checking the same identities and trusted creation/ownership evidence. The name alone does not establish ownership. Save verified metadata and reconnect rather than creating another child.
- No metadata and no matching branch. An explicit setup request authorizes creating one full-data child from the verified protected parent, without an expiration. Record the returned branch identity before retrieving credentials. Read the branch back and verify its parent, endpoint, and absent expiration before publishing ready state.
- Conflicting metadata, duplicate names, unknown ownership, an expiring branch, or a recorded branch that no longer exists. Report the blocker. Do not clear its expiration, replace, reset, refresh, delete, or silently switch targets. A separate repair request must identify the intended operation and target.

An uncertain create response is not proof that creation failed. Reconcile the project listing and trusted operation evidence before retrying. If ownership remains unknown, stop provisioning. Write state atomically; mark it ready only after metadata and credentials agree with live Neon state.

Do not call `.cursor/scripts/cloud-agent-start.sh`, `scripts/cloud-agent/start.sh`, or [provision-neon-branch](../provision-neon-branch/SKILL.md) for this setup. They create short-lived children. Keep this branch out of disposable cleanup namespaces and inspect applicable cleanup jobs before creating it. Never use the protected parent or Evan's personal branch as an application target.

The branch retains changes across sessions. Record its creation time separately from the source dump/snapshot timestamp; parent refreshes do not establish that this existing child is current. Report unavailable freshness evidence as unknown. Reset, refresh, and deletion require a separate explicit request. Preserve the branch when a task ends or the computer pauses.

## Prepare and start the apps

Inspect prerequisites, processes, listeners, and process ownership first. Reuse healthy processes from the selected checkout. Install missing Node/pnpm, Redis, PostgreSQL client, curl, jq, and the Neon CLI as needed for explicit setup. Use the repository's pinned versions and install script, currently `bash .cursor/scripts/cloud-agent-install.sh`, only when dependencies, app env files, or build outputs are missing. Start Redis without running the cloud provisioner. Do not overwrite existing app env files.

For browser verification, read [the recording guide](../poteto-mode/references/video-recording.md) and [browser hosts](../verify-airgoods/references/browser-hosts.md). Check the available browser tools and recorder prerequisites. Explicit setup may install missing prerequisites; verification alone reports them without provisioning infrastructure.

Use the repository's current terminal commands and ports as truth. A bare setup starts the configured apps; a surface-specific request starts its dependencies. Marketplace also needs public web. Start Warehouse on its configured port when requested.

Source the durable `database.env` privately in each database-consuming launch process. Exporting it in a previous tool call does not bind later processes. The Cursor database wrapper reads a fixed temporary per-run handoff, so do not use it for this durable branch. Read its startup logic and the app's dotenv precedence first. If an existing dotenv override would select another database, report the conflict or use a verified process launcher that enforces the intended connection; do not edit an existing override or assume an exported value wins.

Keep logs and process records outside the repository. Restart only processes owned by this setup after verifying their database target. Preserve other sessions' processes. If concurrent checkouts require incompatible app code or schemas, report the conflict before changing the shared runtime.

## Verify and report

Require Redis PONG, a read-only connectivity check through [query-local-db](../query-local-db/SKILL.md) against the exact verified child, startup evidence for each required service, and HTTP readiness. Verify the running backend uses the durable connection, not an unrelated per-run handoff. A listening port alone is insufficient.

Report the computer ID, branch ID/name, persistence and ownership, state file paths, source freshness evidence or unknown freshness, service URLs, and blockers. Omit credentials and customer records. Leave the branch and required services available. Verification alone may validate this state and start missing authorized processes, but must not create or repair infrastructure.
