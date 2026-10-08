---
name: poteto-help
description: Explain Estack setup, poteto-mode, and which skill or playbook fits a task. Use for $poteto-help or questions about how to use Estack or pstack in Codex. Requests to perform work route to poteto-mode.
---

# Poteto help

Answer the user's help question, give at most one prompt they can send, and link the bundled file that supports the answer. Read that file before recommending it. A request such as "use Estack to fix this bug" asks for action. Read [poteto-mode](../poteto-mode/SKILL.md) and do the work.

Infer the need from the message and conversation. Ask one short question only when the goal is still unclear. Answer the relevant part rather than giving the whole map.

## Get set up

Read the [Estack README](../../README.md) for installation and runtime requirements. This plugin runs in Codex. Do not recommend Cursor Custom Modes, per-role model rules, or `/loop`.

[Setup Estack](../setup-pstack/SKILL.md) explains model and reasoning choices. Subagents inherit the parent model by default. Use another model only when the user requests one that the current tools expose. Independent passes on one model do not establish model diversity. Fewer delegates cost fewer tokens. Save the full playbook for work that needs it.

Start a task with `$estack` or `$poteto-mode`, the goal, and a check that can pass or fail. The playbook tracks its steps and records a reason for each skip.

Bundled hooks can remember explicit activation for the current chat and project. Persistence requires runtime support, trust through Codex's `/hooks` interface, and a receipt that the hook ran. Without that evidence, invoke the skill for each task. Saying `disable $estack` or `disable $poteto-mode` clears hook state.

## Pick a workflow

Use poteto-mode for substantive work. Name an individual skill when the user wants a narrower task. Read the chosen skill before recommending it.

| Goal | Skill |
|---|---|
| Run engineering work with personal defaults and matching project context | [Estack](../estack/SKILL.md) |
| Trace what code does | [How](../how/SKILL.md) |
| Find why code has its current shape | [Why](../why/SKILL.md) |
| Understand a change in plain words | [Teach](../teach/SKILL.md) |
| Recover recent working context | [Recall](../recall/SKILL.md) |
| Settle types and module boundaries | [Architect](../architect/SKILL.md) |
| Review a diff independently | [Interrogate](../interrogate/SKILL.md) |
| Find breakage outside a diff | [Blast radius](../blast-radius/SKILL.md) |
| Compare attempts at one brief | [Arena](../arena/SKILL.md) |
| Divide parallel work into slices or a race | [Swarm](../swarm/SKILL.md) |
| Vet a measured performance number | [Benchmark checklist](../benchmark-checklist/SKILL.md) |
| Prevent repeated agent mistakes | [Correct](../correct/SKILL.md) |

For other goals, inspect sibling skills' frontmatter and route by their descriptions. Use [Create verification skill](../create-verification-skill/SKILL.md) when the project lacks a way to drive the real app. For project requirements, use [Estack's project table](../estack/SKILL.md#project-context) and read the matching context. Estack always continues through poteto-mode, its selected playbook, and applicable principles.

## Playbooks and principles

Playbooks live inside poteto-mode. Describe the task or name the playbook in the prompt. Read its Playbooks section for the complete map.

- "Check on PR 123" selects Babysit and stops at merge-ready unless the user authorizes landing. Opening a PR alone does not trigger it.
- "Land this stack" selects Shipping.
- "Take over this branch" selects Session pickup.
- "Plan this multi-phase change" selects [Multi-phase plan](../poteto-mode/playbooks/multi-phase-plan.md) and produces a plan.
- "Stack this queue for my review" selects Autopilot-stack. Autopilot-full needs landing authority.

Principles are single-rule skills the playbooks read when applicable. A user can steer with a principle name or invoke `$principle-<name>` directly. Read the leaf skill before explaining it.

## Fix a run or customize Estack

If a workflow stopped applying, check the hook receipt and current activation before claiming persistence. If agents overwrote each other, give concurrent writers separate worktrees. If a run claims success from a green build, ask for the actual command, flow, stored value, or profile. An unattended run needs a finish predicate and an available, authorized Codex automation tool to survive the session.

[Automate me](../automate-me/SKILL.md) captures personal habits. [Reflect](../reflect/SKILL.md) turns session lessons into proposed skill edits. Correct changes the repository to prevent proven repeated mistakes. A help question does not authorize those edits. Keep any approved skill fix in its own PR.

Lead with the answer. Give at most one example prompt in a code block, then link the file you read. Prefer its real workspace path or skill resource link. Use the public copy under `https://github.com/evan-mavis/skills/blob/main/estack/` only after verifying that it exists there.
