# estack for Factory

Evan's Factory plugin, adapted from Lauren Tan's pstack with personal defaults and Airgoods workflows. This is a complete editable package. It has no overrides, generated layers, or symlinks. Shared changes must be carried into the Codex, Devin, and Cursor variants under the repository's `AGENTS.md` rules.

## Install

From the repository root with its marketplace catalog:

```sh
droid plugin marketplace add .
droid plugin marketplace list
droid plugin install estack-factory@evan-skills --scope user
```

Read back the registered marketplace name from `marketplace list`; local or remote source names can differ. Substitute the actual registered name in the install command. After the repository is pushed, register `evan-mavis/skills` as the remote marketplace instead of the local path. Updating a checkout does not publish it or update an installed copy.

Open `/skills` and `/droids` to verify discovery, and `/diagnostics` for invalid definitions. Invoke `/estack` or `/poteto-mode` with the task and a checkable outcome. Individual skills remain available. Skills with explicit-only policies keep them in native frontmatter.

## Runtime

Native profiles live in `droids/` and use `model: inherit`. Only the root can call Task; child droids return delegation requests, and the root runs independent reviews as siblings. TaskOutput collects background results. Workspaces and worktrees need explicit ownership; this plugin does not provision them.

This package does not ship the original activation hooks or session parser. Invoke the skill for each task. History workflows use accessible, workspace-scoped Factory history when available and report gaps otherwise. The worktree audit marks session ownership unverified until independently checked.

Scheduled workflows resolve the live Factory automation tools and verify the target computer, identity, durable ledger, cadence, and state. Automations start separate sessions. Without scheduling access, monitoring stays in the active session. Airgoods still uses the external GitHub `@codex review` service and the required `evan-mavis` identity.

Browser and app proof require available control tools, configuration, and synthetic fixtures. Recorded walkthroughs follow [the recording recipe](skills/poteto-mode/references/video-recording.md), with agent-browser, cursor evidence, and artifact inspection. Missing capabilities are blocked proof. Installation does not install browser dependencies or start app services.

See [Factory plugins](https://docs.factory.com/harness/plugins), [skills](https://docs.factory.com/harness/skills), [custom droids](https://docs.factory.com/harness/subagents), and [automations](https://docs.factory.com/software-factory/automations). Source attribution remains in [UPSTREAM.md](UPSTREAM.md) and [LICENSE](LICENSE). `NOTICE-hooks` preserves historical hook attribution; no hook code ships in this package.
