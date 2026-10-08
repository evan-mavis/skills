### Authoring or modifying a skill

**You own the skill's voice.**

1. Read an available skill-authoring skill when present. Otherwise use Factory's [native skill format](https://docs.factory.com/harness/skills). Keep `name` and `description` frontmatter, concise decision-changing instructions, and supporting files beside the skill. Use `.factory/skills/<name>/SKILL.md` for project skills or `~/.factory/skills/<name>/SKILL.md` for personal skills. Preserve existing invocation policy; `disable-model-invocation: true` makes a skill explicit-only.
2. Validate the skill: frontmatter has `name` and `description`, referenced files exist, cross-skill links resolve.
3. Test cases if structural. Skip if subjective.
4. Run **Opening a PR**.

When in doubt, delete. Keep only prose that changes a decision. Tell it to do the thing and skip the reason. Explain only when the rule is confusing without one. Match tone to scope. Point at structural sources (types, READMEs, config) per the **encode-lessons-in-structure** principle skill. Delegate to other skills by path. Don't restate. A workflow you keep hitting but isn't captured → propose a new skill.

**Reply:** summary of the skill, key design decisions, validation notes.
