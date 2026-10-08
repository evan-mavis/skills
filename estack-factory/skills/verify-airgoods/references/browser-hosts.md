# Factory browser evidence

Resolve routes, actions, and pass conditions from the selected Airgoods feature map. Resolve ports
from the active checkout. Repository paths in a feature map refer to that checkout.

When using a skill reader, resolve the registered `poteto-mode` skill and read its `references/video-recording.md` resource. Do not use the plugin root as a skill package.

## Browser

Honor the user's browser choice. For video walkthroughs, use `agent-browser` with `--cursor` per
[Record a demo](../../poteto-mode/references/video-recording.md). For other driving, prefer available
browser or computer-control tools exposed by Factory or a configured MCP server and read their returned documentation before continuing.

Create a run-owned tab or session and record its origin, viewport, account, and driver. Use observed
roles, labels, and refs. Re-read after page changes. Do not alter the user's tabs, profile, cookies,
or storage. A new tab does not prove account isolation. Require documented isolation for anonymous
or conflicting-account proof. Use only documented browser operations.

Do not install tools while maintaining skills. Read bundled sibling skills through the Factory skill
interface or their `SKILL.md` paths.

## Runtime

Follow [Direct local runtime](local-runtime.md) for startup and database checks. Reuse the existing
local development environment and configuration; start only missing required apps with direct app
commands. Do not invoke previewctl or `provision-local-worktree-environment`, create another worktree,
or create a remote preview. Check fixtures, authentication, isolation, and recording before driving.
Report specific missing prerequisites as blocked proof instead of provisioning infrastructure.

## Proof and cleanup

Record after authentication and synthetic fixture setup. Keep account, route, data, viewport, and
action identical for before and after evidence. Exclude credentials and personal data.

Confirm visible outcomes with a second user-facing read and required side effects through read-only
API or database evidence. A loaded route or success toast alone does not prove completion. Internal
setters are not user actions.

Define `<evidence-root>` as the absolute, home-expanded path to `~/.factory/verification`.
Create a private run directory below it with permissions restricted to the current user.

Save snapshots, screenshots, video, redacted state evidence, and run notes under an absolute
`~/.factory/verification/<surface-skill>/<run-id>/` directory. Keep artifacts outside the repository.
Finalize and inspect video before closing the run-owned session. Preserve evidence and adopted
services. Stop only processes or sessions this run owns, and report cleanup failures.
