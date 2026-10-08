---
name: setup-pstack
description: Explain or select Cursor subagent models for pstack workflows. Use for /setup-pstack, pstack budget, or changing pstack model choices.
---

# Setup pstack

Bundled custom agents use `model: inherit`. Omit a Task model override to keep the parent model. Built-in Explore, Bash, and Browser agents may select their own models.

1. Inspect the active Task schema, available agents, and model choices. Never invent model IDs or tool fields.
2. For an explicit user model request, use an available Task model override or an authorized profile edit. Do not change global settings without that scope. Report unavailable choices and inherit the parent.
3. Verify the effective model from the subagent task card. Admin restrictions or plan limitations can cause fallback. Independent passes still need separate reviewers; one model does not establish model diversity. A subagent selection does not change the parent chat's model.
4. Check for a project `verify-*` skill or executable app driver. If absent, offer the project-local [verification skill workflow](../create-verification-skill/SKILL.md) once.

See [Cursor subagents](https://prod.cursor.com/docs/subagents) and [plugins](https://prod.cursor.com/docs/plugins).
