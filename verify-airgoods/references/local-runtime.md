# Local runtime without previewctl

These verification skills use the current Airgoods checkout and its existing development configuration. The user explicitly does not want previewctl in this workflow. Do not invoke previewctl, the `provision-local-worktree-environment` skill, or its helper; do not create, reset, or delete databases, Redis containers, branches, worktrees, or preview environments as verification setup or cleanup. This applies even when general repository guidance recommends managed worktree provisioning.

## Resolve the existing environment

1. Resolve the current Git root, read its applicable instructions, source the installed nvm initialization if needed, and run `nvm use "$(cat .node-version)"` from that root.
2. Inspect the relevant app's startup script, existing development configuration, and listener ownership without printing credentials or full environment files. Determine actual ports and API origins from that configuration and running listeners. Do not depend on `.previewctl.json`, generate environment overlays, or assume a port is free.
3. Reuse healthy app processes belonging to this checkout. Record their ownership and leave them running afterward. Do not adopt another checkout's listener merely because it uses a familiar port.
4. For backend-dependent flows, confirm that the already-configured database and Redis are available and that the target database is appropriate for the requested actions. Do not assume the database is disposable or isolated. If a required service, configuration, dependency, or suitable fixture is missing, report the specific prerequisite; do not provision a replacement.

## Start only missing app processes

Use the repository's direct app commands from the Git root, each in a tracked terminal/process session:

| App | Command | Default port, only if configuration agrees |
| --- | --- | --- |
| Backend API | `pnpm --dir apps/backend dev` | 8000 |
| Queue worker, only for asynchronous recipes | `pnpm --dir apps/backend dev:queue` | 8001 |
| Marketplace web | `pnpm --dir apps/web dev` | 3000 |
| Public web | `pnpm --dir apps/web-public dev` | 3006 |
| Warehouse | `pnpm --dir apps/warehouse dev` | 3005 |

Start only the services needed by the selected surface and absent from the existing environment. Do not use the root start-everything command. Let the selected surface's Doctor checks establish readiness before driving.

Respect the repository's no-lint/typecheck/tests/build/format-by-default instruction. Inspect lifecycle hooks before starting: the current backend `predev` removes its build directory and builds email templates. If that build is not authorized, reuse an already-running backend or report the missing startup prerequisite rather than silently running the hook. Verification-skill installation or maintenance does not itself authorize starting the app.

## Database and cleanup

Use `$query-local-db` only after confirming its resolved source matches the database used by the running backend. A local app can point at a shared or remote database; its host alone does not establish that mutations are safe. Preserve the feature recipe's authorization and fixture requirements.

Restore authorized reversible fixture changes while the needed services are still running. Stop only app processes started by this verification run, using recorded process/session IDs. Leave the existing database, Redis, other infrastructure, adopted app processes, and environment files untouched. Keep all evidence outside the repository at the path specified by the surface verifier.
