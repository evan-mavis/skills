# estack for devin

Evan's pstack workflows and Airgoods skills, maintained directly in `estack-devin/`. This is a complete editable package. Shared changes also belong in the Codex, Factory, and Cursor variants, following the repository's `AGENTS.md`.

Install from this checkout:

```sh
devin plugins install --local ./estack-devin
```

After the files are pushed to the repository, install the remote package:

```sh
devin plugins install evan-mavis/skills#estack-devin
```

Start a task with `/estack-devin:estack` or `/estack-devin:poteto-mode`, the goal, and a check that can pass or fail. Individual skills use `/estack-devin:<skill>`. Invocation triggers live in skill frontmatter. Bundled hooks remember explicit activation for the current session and project, remind the agent on later prompts, and restore the reminder after resume or compaction. Say `disable /estack-devin:estack` or `disable /estack-devin:poteto-mode` to clear activation. Check `/hooks` and a current receipt before claiming persistence. Devin currently documents plugin hooks for CLI and Desktop; cloud execution is unverified. Without hook evidence, invoke the skill for each task.

Hooks require Node.js. State and receipts live under `${XDG_STATE_HOME:-~/.local/state}/estack-devin/poteto-mode/`, keyed by hashed session and project identities. They contain activation and timestamps, never prompt text. Inactive state expires after 30 days. Hooks add reminders without granting authority or blocking actions. `hooks/scripts/poteto-mode-state.mjs` is the editable source. After editing it, run `bun scripts/package-devin-hooks.mjs` from the repository root to refresh the self-contained commands in `hooks.json`. This avoids undocumented plugin-path variables.

The package includes the same `assets/maul-mandalorian-avatar.png` as Codex. Devin's documented manifest and current editor expose no custom plugin icon setting.

Devin CLI and Desktop load the bundled custom agent profiles. Cloud sessions currently do not. Workflows default to `subagent_general` with the bundled role prompt to inherit the parent model. Custom profiles use Devin's model router unless pinned. Background delegates can use only pre-approved tools; nested delegation needs an available custom profile with a documented `max-nesting` limit. Missing delegation leaves required independent-review gates incomplete.

History skills use accessible task history or scoped transcript exports and report gaps. No local transcript schema or scheduler is assumed. Long runs continue in the active session unless an authorized scheduler is actually exposed. Browser verification uses the active session's browser tools or an installed driver. Recorded demos follow the [recording guide](skills/poteto-mode/references/video-recording.md), including required tools and verified artifact delivery. Installing this plugin does not provision app services, browser tools, or credentials.

Airgoods babysitting keeps the external `@codex review` GitHub reviewer and its existing identity, reply, no-merge, and verification safeguards.

Local folder installs are linked to this source and load edits in the next session. Remote installs refresh with `devin plugins update estack-devin`. See the official [plugin guide](https://docs.devin.ai/cli/extensibility/plugins/overview), [subagent guide](https://docs.devin.ai/cli/subagents), and [skill format](https://docs.devin.ai/cli/extensibility/skills/creating-skills). Repository edits and publication remain separate.
