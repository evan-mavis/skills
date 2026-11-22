---
name: setup-cloud
description: Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill. Set up or resume the Airgoods development servers in Capy cloud, with a verified disposable Neon child.
---

# Set up Airgoods cloud

Use only for work in Airgoods-Inc/airgoods or when the user explicitly targets Airgoods. Otherwise, do not use this skill. Run this workflow only on a Capy cloud machine, not a local desktop checkout. An explicit cloud setup request authorizes one disposable Neon child as part of setup. Verification alone must reuse an existing child and must not create one.

## Prepare

Read the checkout's instructions, `.cursor/README.md`, `.cursor/environment.json`, `.cursor/Dockerfile`, and the scripts named by the environment file, including the Neon provisioner and database wrapper. Use the checked-out commands and ports if they differ below. Capy Setup or snapshots may have installed dependencies, but do not assume they started services. Inspect listeners and process ownership; reuse healthy services from this checkout, not another checkout.

Check the required Node and pnpm versions, Redis, curl, jq, and `psql`. If dependencies, example env files, or workspace build outputs are missing, run the configured install command from the repository root, currently `bash .cursor/scripts/cloud-agent-install.sh`. It copies only missing env files and builds dependencies; it does not start services. Do not overwrite existing env files. Install additional workspace dependencies only when a requested app needs them.

## Resolve the database

The current repo uses `/tmp/airgoods-cloud-agent-neon.env`, with `.status` and `.meta.json` alongside it. Never print or trace the handoff, connection URL, API key, or other secrets. Inspect the checked-out scripts before using these paths.

- If status is `ready`, verify the protected credential file and metadata against Neon or trusted current-run provisioning evidence. Require the exact project, configured protected parent, child ID and endpoint, unexpired branch, and a child distinct from the parent. A branch name or hostname prefix is not proof. Reuse only a matching child.
- If status is `provisioning`, wait for the existing operation with a bounded timeout, normally 180 seconds. Never start another provisioner.
- If no handoff or startup operation exists, an explicit setup request may start one. Check `NEON_API_KEY`, `NEON_PROJECT_ID`, and `NEON_PARENT_BRANCH_ID` are present without printing values, then run `bash .cursor/scripts/cloud-agent-start.sh` once. It starts Redis and provisions a child; the current provisioner sets an eight-hour expiration. Wait for `ready` and verify the resulting identity before starting database consumers.
- If status is failed, the handoff is inconsistent, or the child expired, stop and report the blocker. Do not silently replace a child whose data may belong to an interrupted task. If the outcome of a create is uncertain, inspect the existing operation and Neon before any retry; never create a duplicate.

The start script clears the handoff and creates a child every time. Never rerun it to restart Redis or apps. If Redis alone is down, use the Redis configuration in the checked-out start script without its provisioning step. Never use the parent or local Postgres for app processes. Use this repository lifecycle for normal cloud setup. Do not provision a separate branch.

The child contains production-copy data. Limit access to the assigned task. Record the verified project, parent, child, and expiration. Report source dump or snapshot freshness only when supported by evidence; branch creation time is not data freshness.

## Start and verify

For a bare setup request, start every configured terminal. For a specific app, start its dependencies. Launch each missing service in its own persistent Capy process session, with logs outside the repository. Use the checked-out database wrapper for every backend process so each receives the verified handoff; environment exports do not persist between tool calls. The wrapper currently removes a stale backend `.env.local` `DATABASE_URL` override. Restart a task-owned process if it used a different database.

The current configured services are backend API on 8000, queue worker on 8001, webhooks on 8003, marketplace on 3000, and public web on 3006. Marketplace needs public web for proxied routes. Warehouse is not a configured terminal; when requested, prepare its dependencies and run its current dev command, normally on 3005.

Require Redis `PONG`, a read-only database check against the same verified child using `.agents/skills/query-local/SKILL.md`, startup evidence for each required process, and bounded HTTP readiness checks for HTTP services. A listening port alone is not readiness. Allow cold compiles and inspect logs on failure without exposing secrets. Do not claim success if any required service fails.

Report the child ID, name, expiration and known or unknown data freshness, service URLs, process/session IDs, and blockers. Leave the child, handoff, Redis, and servers available for the task. Capy cloud machines can sleep and stop processes, so recheck readiness after wake. For visual verification, follow the repository's own verify skill.
