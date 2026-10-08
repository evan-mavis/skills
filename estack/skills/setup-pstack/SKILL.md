---
name: setup-pstack
description: Explain or select Codex model and reasoning choices for this session's Estack workflows. Use for $setup-pstack, "configure Estack models", "Estack budget", or changing Estack's model choices.
---

# Setup Estack

Codex workflows inherit the parent model and reasoning effort by default.

## Steps

1. Detect available model and reasoning choices from the live Codex subagent tool. Never select a model or effort that the tool does not expose.
2. If the user explicitly requests a model or reasoning effort, use that available selection for the requested scope. If unavailable, report the limitation and inherit the parent. Do not invent fallback slugs.
3. State the effective selection and scope. Do not claim this writes persistent global role settings or changes the parent chat's model. Independent reviewer panels still run their prescribed passes; report the actual models and any lack of model diversity.
4. Check whether the project has a way to drive the real app for proof (a `verify-*` skill or an existing harness). If not, offer a project-local verification skill once. On yes, read `../create-verification-skill/SKILL.md`; on no, move on without pushing.
