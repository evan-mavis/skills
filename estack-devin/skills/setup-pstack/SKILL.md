---
name: setup-pstack
description: Explain or select available Devin subagent profiles and model choices for Estack workflows. Use for setup-pstack, "configure Estack models", "Estack budget", or changing Estack's model choices.
---

# Setup Estack

Use `subagent_general` with the required role prompt to inherit the parent model. Explore and custom profiles use Devin's router unless a model is pinned. `run_subagent` selects a profile, not a model slug. Do not assume per-spawn reasoning controls or visible worker model identities.

1. Inspect the live profiles and configuration capabilities. Use only selections the current Devin session and organization allow.
2. For a user-requested alternate model, select an available profile that already pins it, or make an authorized scoped profile change using the [documented model field](https://docs.devin.ai/cli/subagents). Report unavailable selections and keep the general profile. Never claim a prompt alone selects a worker model.
3. State the effective profile, known model, scope, and gaps. Custom plugin profiles load in CLI and Desktop, not cloud. Independent reviewer panels retain their prescribed passes. Report model diversity only when verified. Do not claim a persistent global change or a change to the parent model unless you made and verified it.
4. Check for a project verifier or existing app driver. If missing, offer a project-local verification skill once. On yes, read [Create verification skill](../create-verification-skill/SKILL.md). On no, continue.
