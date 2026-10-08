# estack for cursor

Evan's pstack workflows with personal defaults, Airgoods PR handling, and live verification. This is a complete editable plugin. Shared changes belong in the other variants under the repository's `AGENTS.md` rules.

## Install

After the repository is pushed, open Cursor's Customize page and choose **From GitHub Repository**. Import `https://github.com/evan-mavis/skills`, then install `estack-cursor` from the `evan-skills` marketplace. The root `.cursor-plugin/marketplace.json` points at this folder. Disable the separate pstack plugin to avoid duplicate skills and conflicting workflow guidance.

For a local install, copy this whole folder to `~/.cursor/plugins/local/estack-cursor/`, then run **Developer: Reload Window**. Confirm Estack's skills and two agent profiles in Customize. Local plugin imports must be allowed by your team. Cursor skips symlinks that point outside its local plugin directory. A Git source update and an installed copy are separate; refresh or recopy the source and reload to verify the new version.

## Use

Start with `/estack` or `/poteto-mode`, the task, and a checkable outcome. Select `/estack` as a Custom Mode with Option+Enter on macOS or Alt+Enter on Windows/Linux to keep it in context for the whole chat. Confirm its badge is visible. A regular slash invocation applies to one turn. Native mode persistence replaces activation hooks in this variant; upstream pstack's reviewed snapshot ships no hooks either.

Individual skills use `/skill-name`. Explicit-only policies stay in native frontmatter. The manifest's `logo` points to the same artwork as Codex.

## Runtime

The bundled `poteto-agent` and `comment-sicko` profiles use `model: inherit`. Native Task can run parallel workers; direct children can delegate one further level when available, and grandchildren cannot. Resolve background output and stop operations from the live tool schema and returned handles. Give concurrent writers isolated worktrees. An unavailable independent review leaves proof pending.

Use Cursor's native Browser tools or an installed browser driver for live verification. Required recordings follow [the recording guide](skills/poteto-mode/references/video-recording.md), including pointer effects and verified artifact delivery. Airgoods verification routes through the bundled surface skills and feature maps. Installation does not provision browser tools, app services, or credentials.

History workflows read the active conversation or scoped workspace transcript supplied by the host, and report gaps. The worktree audit keeps ownership unverified when session usage cannot be established. Scheduled work follows Cursor's installed `/automate` workflow or exposed controls. Verify the new cloud run can access its ledger, repository, skills, and context tools before promising a later wake. Airgoods retains the external GitHub `@codex review` service and `evan-mavis` identity.

See [Cursor plugins](https://prod.cursor.com/docs/plugins), [plugin format](https://prod.cursor.com/docs/reference/plugins), [skills and Custom Modes](https://prod.cursor.com/docs/skills), [subagents](https://prod.cursor.com/docs/subagents), and [automations](https://prod.cursor.com/docs/cloud-agent/automations). Source attribution is in [UPSTREAM.md](UPSTREAM.md) and [LICENSE](LICENSE).
