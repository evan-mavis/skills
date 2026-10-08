---
name: estack
description: Route substantive engineering tasks through poteto-mode with Evan's defaults. Use for bug fixes, features, refactors, architecture, technical investigations, PR work, or an explicit Estack request. Skip casual turns and user opt-outs.
---

# estack

For a substantive engineering task or explicit Estack request:

1. Read [Personal defaults](references/personal-defaults.md).
2. Match the target repository using the project table below. Read its context when matched; otherwise use the generic workflow. Resolve the target from its Git remote or an explicit repository or PR supplied by the user. Normalize SSH and HTTPS forms, optional `.git`, and GitHub owner/repository case. Worktrees use their repository's identity. A folder name or similar app layout is not a match. If the task targets multiple repositories, apply each context only to its own work.
3. Always read [poteto-mode](../poteto-mode/SKILL.md) in full, then open the matched playbook and track its steps. Read the applicable principle skills in full. Project context supplies requirements and task skills; it never replaces the playbook or its independent proof gates.

Skip casual turns and user opt-outs. Host instructions, repository instructions, and explicit user requests take precedence.

## Project context

| Target repository | Read before task-specific work |
| --- | --- |
| `github.com/Airgoods-Inc/airgoods` | [Airgoods](references/projects/airgoods.md) |

To add a project, add its context under `references/projects/` and one row here. Keep project rules out of generic playbooks. Pass the selected context's file pointer and target repository to delegates, including independent reviewers and scheduled runs. Re-resolve the context when the target repository changes.

## Host and personal guidance

This plugin runs in Codex.

Bundled hooks remember explicit Estack or poteto-mode activation for the current chat and project. Say `disable $estack` or `disable $poteto-mode` to clear it. Hooks require runtime support and trust through Codex's `/hooks` interface. Without evidence that the current session's hook ran, apply the selected skill for this turn and do not claim persistence.

Write ordinary responses in lowercase, clear, warm prose. Preserve case-sensitive technical text and exact required report prefixes. For rewriting text in Evan's voice, use [reword](../reword/SKILL.md).

Resolve bundled skills through the current skill catalog when their workflow applies. With a skill-resource reader, select the target skill and use its returned resource identifier; do not pass a sibling filesystem path as a resource of this entry skill. With filesystem tools, sibling paths are relative to the containing file. Preserve their supporting references and scripts. Report missing capabilities without claiming the workflow completed.

## Issue reporting

This convention applies across Estack skills. If you encounter a problem with the environment, tooling, or task execution, or discover that plugin/skill guidance could make the work more efficient or clearer, explicitly report it using the exact prefix:

I RAN INTO AN ISSUE:

Briefly state what happened, its impact, any workaround used, and the specific documentation or tooling improvement recommended. Report issues even when a workaround allows the task to succeed. Never include credentials or sensitive data.

Keep these reports actionable and concise, and continue authorized work when possible. This convention does not authorize editing skills or changing infrastructure outside the task’s scope.
