---
name: setup-pstack
description: Explain or select available Capy subagent model choices for Estack workflows. Use for setup-pstack, "configure Estack models", "Estack budget", or changing Estack's model choices.
---

# Setup Estack

Capy subagents inherit the parent model by default. Choose a different available model only when the user requests it or the task clearly warrants it; pass the selection through the subagent tool, not just the prompt.

1. Inspect the current session's available model choices and organization policy.
2. Apply any authorized selection to the relevant subagent and report unavailable choices. Do not claim a prompt alone selects a model.
3. State the effective model when observable, its scope, and any gaps. Independent reviewer panels retain their prescribed passes. Report model diversity only when verified. Do not claim a persistent global change or a change to the parent model unless you made and verified it.
4. Check for a project verifier or existing app driver. If missing, offer a project-local verification skill once. On yes, read [Create verification skill](../create-verification-skill/SKILL.md). On no, continue.
5. Check for a project skill that runs formal verification against named code. If absent, offer the [formal verification skill workflow](../create-formal-verification-skill/SKILL.md) once. Run it only if the user accepts. On no, continue.
