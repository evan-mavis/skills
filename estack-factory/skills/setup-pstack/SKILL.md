---
name: "setup-pstack"
description: "Explain or select Factory droid model and reasoning choices for pstack workflows. Use for /setup-pstack, pstack budget, or changing pstack model choices."
---

# Setup pstack

Factory custom droids use `model: inherit`. Omit Task `complexity` to inherit the parent model and reasoning. Built-in `worker` and `explorer` have default complexity tiers that can select a different model through configured routing.

1. Inspect the available droids with `/droids` and current Subagents settings in `/settings`. Never invent model IDs or Task fields.
2. For an explicit user model request, verify an existing droid or complexity tier selects that available model. Task accepts `complexity`, not arbitrary model or reasoning overrides. Do not edit global settings or plugin profiles unless the request authorizes that scope. Report unavailable choices and inherit the parent.
3. Report the effective selection and scope. Independent passes still need separate reviewers; one inherited model does not establish model diversity. A Task selection does not change the parent chat's model.
4. Check for a project `verify-*` skill or executable app driver. If absent, offer the project-local [verification skill workflow](../create-verification-skill/SKILL.md) once.

See [Factory custom droids](https://docs.factory.com/harness/subagents) for model resolution and [plugins](https://docs.factory.com/harness/plugins) for profile packaging.
