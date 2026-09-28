# Host runtime

pstack's skills and playbooks are written for Cursor. On Factory (Droid), Codex, or Devin, read each Cursor term below as its host equivalent. Identify the host from the tools you actually have. Everything not listed here applies as written.

## Tools and delegation

| Cursor term in pstack | Factory (Droid) | Codex | Devin |
|---|---|---|---|
| `/loop` in dynamic mode | The `Loop` tool. Let watcher output drive each wakeup. | No loop primitive. Run the watcher in the foreground with a long timeout. It blocks until a verdict. On timeout, rerun it. Never add a sleep loop. | No loop primitive. Run the watcher as a background `exec` shell (`timeout: 0`) and read it with `get_output`, or foreground it with a long timeout and rerun on timeout. Never add a sleep loop. |
| `Task` with `subagent_type: "poteto-agent"` | `worker` with the `agents/poteto-agent.md` body in the prompt. | A generic subagent with the `agents/poteto-agent.md` body in its prompt. | `run_subagent` with `profile: "subagent_general"` and the `agents/poteto-agent.md` body in the task prompt. |
| `subagent_type: "Comment Sicko"` | `explorer` with the `agents/comment-sicko.md` body in the prompt. | A read-only generic subagent with that body in its prompt. | `run_subagent` with `profile: "subagent_explore"` and the `agents/comment-sicko.md` body in the task prompt. |
| `subagent_type: "generalPurpose"` | `worker`. | A generic subagent. | `run_subagent` with `profile: "subagent_general"`. |
| `run_in_background: true` | Run the `Task` in the background (`await: false` or `run_in_background: true`, whichever the schema has). | Launch the subagent and continue. Collect results later. | `run_subagent` with `is_background: true`. Collect results with `read_subagent`. |
| A delegate that fans out internally, or any nested subagent layer | A Factory subagent cannot spawn subagents. The parent runs every fan-out itself and gives each delegate a leaf task. | Nested spawns work when the Codex runtime allows them. Otherwise the parent fans out. | A Devin subagent cannot spawn subagents. The parent runs every fan-out itself and gives each delegate a leaf task. |
| `AskQuestion` | `AskUser`. | Ask in the reply and stop the turn. | The `ask_user_question` tool. A skipped or declined answer means proceed with best judgment. |

## Models

1. Every subagent inherits the parent model. Ignore pstack's named models (`grok-…`, `claude-opus-…`), `/setup-pstack`, and `pstack-models` role lines. A panel or second opinion runs fresh subagents with the same prompt on that model. Say it shared a model.
2. When the user names a model for a task, pass it on Cursor. On Factory, Codex, or Devin, use a custom droid or agent that pins that model if one exists. Otherwise inherit and say the host cannot pin a model per call.

## Skills, surfaces, and paths

| Cursor term in pstack | Factory (Droid) | Codex | Devin |
|---|---|---|---|
| `/deslop` from `cursor-team-kit` | The **deslop** skill bundled in pstack. | Same. | Same. |
| `create-skill` (Cursor's built-in) | No built-in equivalent. Follow the host's skill docs for frontmatter and layout, then continue with the authoring-a-skill playbook. | The `skill-creator` system skill. | No built-in equivalent. Follow the `devin-cli` skill's docs for frontmatter and layout, then continue with the authoring-a-skill playbook. Project skills go in `.devin/skills/<name>/SKILL.md`, global skills in `~/.config/devin/skills/`. |
| `control-ui` / `control-cli` from `cursor-team-kit` | `droid-control` (with `agent-browser` for web and `tuistory` for TUIs). A project's own verification skill takes precedence. | `agent-browser` for web. A project's own verification skill takes precedence. | `browser_preview` for web: it opens a live preview the user drives, so DOM and console evidence is user-relayed, not autonomous. `exec` with `tty: true` plus `write_to_process` for TUIs. A project's own verification skill takes precedence. |
| "Cursor's built-in babysit skill" | Any other installed skill named `babysit` or matching babysit phrasing. A project adapter such as `babysit-airgoods-pr` is not this. Route to it when its description matches. | Same. | Same. |
| This session's transcript under `agent-transcripts/` or `~/.cursor/projects/` | `~/.factory/sessions/<cwd-slug>/<session-id>.jsonl`, where `<cwd-slug>` is the working directory with each `/` replaced by `-`. Read only this session's file. | The newest `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` whose recorded working directory matches. Read only this session's file. | No readable per-session transcript. `~/Library/Application Support/Devin/windsurfSessionHandoff.db` only logs session handoffs. Treat transcript-reading steps as unavailable for this session. |
| This workspace's past transcripts (`~/.cursor/projects/<slug>/agent-transcripts/`, used by recall, reflect, automate-me, and show-me-your-work) | Every file in `~/.factory/sessions/<cwd-slug>/`. Read no other workspace's folder. | Every `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` whose recorded working directory matches this workspace. | No on-disk session history. These skills work only from the current conversation and git state. |
| The newest-chat column of `scripts/worktree-audit.sh` | The script only scans Cursor transcripts, so the column stays blank. Grep the sessions folder above for the worktree path instead. | Same, with the Codex sessions above. | The column stays blank. No Devin session folder exists to grep. |
| Project skills in `.cursor/skills/` | `.factory/skills/`. | `.agents/skills/`. | `.devin/skills/`; a project `.agents/skills/` is also scanned. |
| User skills in `~/.cursor/skills/` or `~/.cursor/plugins/` | `~/.agents/skills/`, `~/.factory/skills/`, and `~/.factory/plugins/`. Factory hides skills marked `disable-model-invocation: true` (most of pstack) from the model, so read `~/.agents/skills/<name>/SKILL.md` directly. The user can still run `/<name>`. | `~/.codex/skills/`, `~/.agents/skills/`, and `~/.codex/plugins/`. | `~/.config/devin/skills/` and `~/.agents/skills/` (plus `~/.claude/skills/` for compatibility). Devin honors `disable-model-invocation: true`, so read `~/.agents/skills/<name>/SKILL.md` directly for those skills. |
| The `mcps/` directory Cursor exposes | The MCP and connector tools in this session. | The MCP tools in this session. | The MCP tools in this session (`mcp_list_servers`, `mcp_call_tool`). No Linear integration is guaranteed; Linear-reading steps (`babysit-airgoods-pr`, `to-linear-spec`) need a configured MCP or the issue pasted in. |
| A Cursor restart (Pause safely) | A Droid session end or compaction. | A Codex session end or compaction. | A Devin Desktop session end or compaction. |

## Orchestration

| Cursor term in pstack | Factory (Droid) | Codex | Devin |
|---|---|---|---|
| A request that matches **Orchestrate**, **Autopilot-full**, or **Autopilot-stack** | Do not run the playbook. Write a mission brief with the program objective, standing orders, PR queue, verification bar, and landing authority, drawn from that playbook. Ask the operator to start it in Mission Mode or with `droid exec --mission -f <brief>`. | Run the playbook locally with the rows below. | Run the playbook locally with the rows below. |
| `environment: "cloud"`, a Cursor cloud agent, or a cloud root | A fresh `worker` subagent in its own git worktree. | A fresh local subagent in its own git worktree. Cap concurrent writers at what this machine can run. | A fresh `subagent_general` in its own git worktree. Cap concurrent writers at what this machine can run. |
| `/goal` | A Mission when the work is a program. Otherwise state the objective as the exit predicate and keep driving. | State the objective as the exit predicate in the **show-me-your-work** trail and keep driving until it holds. | State the objective as the exit predicate in the **show-me-your-work** trail and keep driving until it holds. |
| The cloud-sleeper wake chain | The `Loop` tool. | The foreground watcher from the `/loop` row. | The background `exec` watcher from the `/loop` row. |
| Multi-phase plan step 4 names the execution playbook | Name a Factory Mission as the executor. | Keep the autopilot or orchestrate choice. | Keep the autopilot or orchestrate choice. |

Bugbot is a GitHub app and works the same on every host. The `watch-pr` script needs `bun` and `gh`.
