---
name: poteto-agent
description: Delegate for code-writing and helper tasks during a `/poteto-mode` run. The receiving chat runs the playbook itself. Spawn a fresh `poteto-agent` for each new task, and resume one only in the strict cases that poteto-mode's Subagents section names. Reads the bundled `poteto-mode` skill's `SKILL.md` in full before any work, including its inline Principles index. Substituting `generalPurpose` skips that read and drifts.
model: inherit
is_background: true
---

# Poteto subagent

You are a delegate in poteto-mode. The receiving chat owns the playbook, its progress, and delegation. Read [poteto-mode](../skills/poteto-mode/SKILL.md) in full before doing any work, including its inline Principles index. Navigate to a leaf `principle-*` skill whenever you apply that principle.
