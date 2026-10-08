---
name: "estack"
description: "Route substantive engineering tasks through poteto-mode with Evan's defaults. Use for bug fixes, features, refactors, architecture, technical investigations, PR work, or an explicit Estack request. Skip casual turns and user opt-outs."
---

# estack

For a substantive engineering task or explicit Estack request, read [Personal defaults](references/personal-defaults.md) and [poteto-mode](../poteto-mode/SKILL.md) in full. Open the matched playbook and track its steps before task-specific work. Skip casual turns and user opt-outs. Host instructions, repository instructions, and explicit user requests take precedence.

This plugin runs in Factory.

This package does not ship activation hooks. Invoke `/estack` or `/poteto-mode` for each task, or let native skill discovery select them. Do not claim activation persists across later prompts, resume, or compaction. An explicit user opt-out takes precedence.

Write ordinary responses in lowercase, clear, warm prose. Preserve case-sensitive technical text and exact required report prefixes. For rewriting text in Evan's voice, use [reword](../reword/SKILL.md).

For an Airgoods cloud setup request, including `@estack setup cloud`, read [setup-cloud-env](../setup-cloud-env/SKILL.md) and carry it through database and server readiness. Before work requiring a running Airgoods app in a cloud session, use that skill to resolve the handoff and start missing required services. Do not assume dependency installation started the dev servers or that Factory executed the repository bootstrap automatically. Documentation-only work does not need app startup.

For Airgoods PR babysitting, merge-ready requests, review-comment cleanup, or outstanding PR work, read [babysit-airgoods-pr](../babysit-airgoods-pr/SKILL.md) and use its overrides. Opening a PR alone does not trigger babysitting.

For Airgoods verification, read [verify-airgoods](../verify-airgoods/SKILL.md) and invoke the affected surface skills. User-visible bugs need a reproduction before editing and verification afterward. Features and improvements need a demo. Read the verifier before starting the work so its proof requirements guide the change.

Resolve bundled skills through the current skill catalog when their workflow applies. With a skill-resource reader, select the target skill and use its returned resource identifier; do not pass a sibling filesystem path as a resource of this entry skill. With filesystem tools, sibling paths are relative to the containing file. Preserve their supporting references and scripts. Report missing capabilities without claiming the workflow completed.

## Issue reporting

This convention applies across Estack skills. If you encounter a problem with the environment, tooling, or task execution, or discover that plugin/skill guidance could make the work more efficient or clearer, explicitly report it using the exact prefix:

I RAN INTO AN ISSUE:

Briefly state what happened, its impact, any workaround used, and the specific documentation or tooling improvement recommended. Report issues even when a workaround allows the task to succeed. Never include credentials or sensitive data.

Keep these reports actionable and concise, and continue authorized work when possible. This convention does not authorize editing skills or changing infrastructure outside the task’s scope.
