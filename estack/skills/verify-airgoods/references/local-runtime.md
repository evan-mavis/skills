# Direct local runtime

Airgoods verification and PR babysitting reuse the existing local development environment in the current checkout, including its database and environment configuration. Start only missing required apps with the direct commands below.

Do not invoke previewctl, `provision-local-worktree-environment`, or provisioning helpers. Do not create another worktree or a remote preview, or create, reset, or delete databases, Redis containers, branches, or environments during setup or cleanup. This policy overrides conflicting repository, cloud setup, and dependency-skill guidance. A missing dependency or configuration is a specific prerequisite to report, not a reason to switch runtimes or provision infrastructure.

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

Read the current repository instructions for required or restricted checks. Inspect lifecycle hooks before starting: the current backend `predev` removes its build directory and builds email templates. If that build is not authorized, reuse an already-running backend or report the missing startup prerequisite rather than silently running the hook. Verification-skill installation or maintenance does not itself authorize starting the app.

## Database and cleanup

Feature recipes that require isolated or branch-local fixtures apply only after proving that isolation for the configured database. Otherwise use authorized fixtures in the existing target or report the mutation proof blocked. Never infer isolation from a local app URL or provision a new database to satisfy a recipe.

Use `$query-local-db` only after confirming its resolved source matches the database used by the running backend. Use it to inspect the existing target; do not invoke environment setup or provision another target to satisfy a query prerequisite. A local app can point at a shared or remote database; its host alone does not establish that mutations are safe. Preserve the feature recipe's authorization and fixture requirements.

Restore authorized reversible fixture changes while the needed services are still running. Stop only app processes started by this verification run, using recorded process/session IDs. Leave the existing database, Redis, other infrastructure, adopted app processes, and environment files untouched. Keep all evidence outside the repository at the path specified by the surface verifier.
