---
name: setup-cloud-env
description: Set up or resume the Airgoods cloud development environment in Devin. Use for setup cloud, boot the cloud environment, or missing cloud dev servers. Reuse the provisioned Neon child, install missing dependencies, start dev servers, and verify readiness.
---

# Set up Airgoods cloud

Make the current cloud checkout ready for development. A bare setup request starts the services listed in `.cursor/environment.json`. A request for one surface starts its required services. Leave them running for the task.

When this skill is used only to prepare verification, reuse the existing provisioned child and start missing required apps. Provision a child only for an explicit cloud setup request. Do not run this cloud bootstrap on a local desktop checkout.

When using a skill reader, resolve the registered `poteto-mode` skill and read its [video-recording resource](../poteto-mode/references/video-recording.md). Do not use the plugin root as a skill package.

## Read the repository setup

Resolve the current Airgoods Git root and read its applicable instructions, `.cursor/README.md`, `.cursor/environment.json`, `.cursor/Dockerfile`, and the scripts named by its `install`, `start`, and `terminals` entries. These are repo-managed setup commands even when the host is Devin. Devin may not have run the repository bootstrap or launched its configured services. Their presence alone does not establish a running environment.

Use the checked-out versions as command and port truth. Inspect existing listeners and process ownership before starting anything. Reuse healthy processes belonging to this checkout. Do not adopt another checkout's services.

## Install missing prerequisites

Check Node, Corepack/pnpm, Redis server/client, curl, jq, and the PostgreSQL `psql` client. Use the repo's Node and pnpm versions and the available cloud package manager for missing system tools. The repository Dockerfile describes the bootstrap requirements; it may not be the image running in Devin.

Cloud environments are expected to include `agent-browser`. Locate the preinstalled version, check its version and current help for compatibility with the required browser and recording operations, and ensure its executable is accessible on `PATH`. Do not reinstall it. If it is missing or incompatible, report `I RAN INTO AN ISSUE:` with the environment prerequisite that needs fixing.

Before driving a video demo, verify an available compatible browser, `ffmpeg`, `ffprobe`, the required encoders, and cursor recording support. Use an installed compatible browser when available; do not assume a browser download is needed. Follow [Browser hosts and evidence](../verify-airgoods/references/browser-hosts.md) and the installed browser skill's current documentation for usage and recording details. Report missing prerequisites with `I RAN INTO AN ISSUE:` and continue setup work that does not depend on them.

If dependencies, app env files, or required workspace build outputs are missing, run the configured install command from the Git root. Currently this is `bash .cursor/scripts/cloud-agent-install.sh`. It copies missing `.env.example` files, installs locked dependencies, and builds backend/web/web-public workspace dependencies. It does not start Redis, provision Neon, or launch apps. Do not overwrite existing env files or rerun a healthy installation without a missing prerequisite.

An explicit cloud setup request includes these dependency builds and the dev commands' startup hooks. Install only additional workspace dependencies required by a requested surface, such as Warehouse, using the current repo scripts.

For video demos, check the CLI, browser, encoders, and cursor recording per [Record a demo](../poteto-mode/references/video-recording.md#preflight). Explicit cloud setup includes missing recorder prerequisites. Verification alone reports missing prerequisites.

## Resolve the per-run Neon handoff

The current scripts use `/tmp/airgoods-cloud-agent-neon.env`, its `.status` file, and its `.meta.json` file. Confirm the paths against the checked-out scripts. Never print or trace the credential file, connection URL, or runtime secrets.

- `ready` with a credential file and matching metadata. Reuse it after checking the child is unexpired, differs from the configured parent, and belongs to the expected project and parent. Match the credential URL's endpoint to the exact child through the Neon API or trusted current-run provisioning evidence. A familiar hostname or branch-name prefix alone is insufficient.
- `provisioning`. Wait for the current startup operation with a bounded timeout, defaulting to the wrapper's 180 seconds. Do not launch a second provisioner. On timeout, report the status and blocker.
- No handoff and no startup operation. Check that `NEON_API_KEY`, `NEON_PROJECT_ID`, and `NEON_PARENT_BRANCH_ID` are present without displaying values. Run the configured start command once, currently `bash .cursor/scripts/cloud-agent-start.sh`. It starts Redis and creates an expiring child from the protected parent. Wait for `ready` and validate the handoff before starting database consumers.
- `failed:*`, inconsistent metadata, or an expired child. Report the specific blocker. Do not silently provision a replacement for a resumed task that may depend on the previous child's data.

The start script clears the existing handoff and provisions a new child on every invocation. Never rerun it merely to restart Redis or apps. If a valid child exists but Redis is down, start Redis using the checked-out script's Redis configuration without executing its provisioning step.

Use this repo lifecycle rather than `/estack-devin:provision-neon-branch` for normal cloud setup. Do not point apps at localhost Postgres or the parent. Do not create a second branch when one is already provisioned.

The configured production parent is refreshed daily from a production dump by GitHub Actions. The copy can lag production. A child starts from that parent's data and can diverge through development changes and later production updates. The child's creation time does not establish when the production dump or snapshot was taken.

Record the verified project, parent, and child identifiers with the source dump or snapshot timestamp and refresh evidence when available. Keep the child creation time separate. Resolve freshness from trusted metadata or refresh evidence; if unavailable, report it as unknown and never infer a freshness timestamp from branch creation.

## Start the dev servers

Run each missing configured terminal command from the Git root in its own persistent terminal/process session. Record session IDs and log locations outside the repository. Source the handoff in each database-consuming process through the repo wrapper. Exporting `DATABASE_URL` in a previous tool call does not carry it into a later command.

The current commands are:

| Service | Command | Port |
| --- | --- | --- |
| Backend API | `bash .cursor/scripts/cloud-agent-run-with-db.sh apps/backend pnpm dev` | 8000 |
| Queue worker | `bash .cursor/scripts/cloud-agent-run-with-db.sh apps/backend pnpm dev:queue` | 8001 |
| Webhooks | `bash .cursor/scripts/cloud-agent-run-with-db.sh apps/backend pnpm dev:webhook` | 8003 |
| Marketplace | `pnpm --dir apps/web dev` | 3000 |
| Public web | `pnpm --dir apps/web-public dev` | 3006 |

The wrapper waits for the handoff and removes a stale backend `.env.local` `DATABASE_URL` override so the child connection wins. Use it for every backend process. Restart a process belonging to this task if evidence shows it started with a different database; a listening port alone does not prove the right connection.

Warehouse is not a configured terminal. When requested, prepare its workspace dependencies and run `pnpm --dir apps/warehouse dev`, currently on port 3005. Marketplace requires public web for its proxied anonymous and marketing routes.

## Verify and report

Require Redis `PONG`, a read-only database connectivity check through [query-local-db](../query-local-db/SKILL.md), startup evidence for each required process, and HTTP readiness of the requested apps. Allow cold compiles and inspect logs on failure. Match the query target to the same verified handoff used by backend processes. Use a repo health route or bounded HTTP request; an open port alone is insufficient.

Report the child branch ID/name and expiration, source and freshness evidence or unknown freshness, service URLs, process/session IDs, and any blockers. Omit credentials and customer records. Leave the branch, handoff, Redis, and dev servers available for the task; do not delete them as setup cleanup. For browser verification, continue with [verify-airgoods](../verify-airgoods/SKILL.md) after startup.
