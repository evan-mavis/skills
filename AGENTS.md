# Agent instructions

Estack has four directly editable variants: `estack/` for Codex,
`estack-devin/` for Devin, `estack-factory/` for Factory, and
`estack-cursor/` for Cursor.
Edit their files directly. There are no generated variants or overrides.

## Keep variants in sync

- When changing a skill or supporting file in any variant, read the corresponding files in the other variants. Keep matching skill names and relative paths where the platforms support them.
- Apply shared workflow changes to all four in the same task. Adapt tool instructions to each platform and preserve workflow safeguards.
- For platform-specific changes, check whether the other variants need an equivalent fix. Preserve intentional differences in tools, metadata, agents, hooks, and session access.
- Adding, renaming, or removing a shared skill requires the same change in all four. Keep supporting files with their skill.
- Before finishing, validate all affected variants and report what changed in each, or why a variant needed no change. Never edit installed plugin caches.

## Edit skills

- Read the target skill and relevant references first. Make surgical, minimal, concise edits. Preserve pstack's intent, workflow, and safeguards. Avoid unrelated rewrites.
- Match the language, tone, and structure of neighboring skills. Use plain, concise instructions. Cut filler and repeated guidance; add only what the task needs.
- Use `/unslop` when writing new skills or changing prose. Read the target variant's `skills/unslop/SKILL.md` and apply it.
- For project-specific skills, state the scope in both the description and opening instructions: "Use only for work in <owner/repo> or when the user explicitly targets <project>. Otherwise, do not use this skill." Use the actual repository identity and project name.
- Preserve valid skill frontmatter and working links. Keep supporting files with their skill. Leave `deprecated/` alone unless requested.
- Check `git status --short` before editing. Run `bun scripts/check-estack.mjs`, `bun scripts/check-estack.mjs devin`, `bun scripts/check-estack.mjs factory`, `bun scripts/check-estack.mjs cursor`, the narrowest relevant tests, and `git diff --check`. For shell edits, run `bash -n`.
- Never commit credentials, host files, dependencies, or logs. Never weaken checks to make them pass.

## Release and update

Repository edits and plugin publication are separate. Publish only when the task includes a plugin update or release.

1. Bump the version of each package included in the release. For Codex, update both `estack/plugin.json` and `estack/.codex-plugin/plugin.json`. For Devin, update `estack-devin/.devin-plugin/plugin.json`. For Factory, update `estack-factory/.factory-plugin/plugin.json`. For Cursor, update `estack-cursor/.cursor-plugin/plugin.json`. Preserve plugin identity, permissions, and metadata.
2. Validate, commit, and push. Use a lowercase subject beginning with `feat:`, `fix:`, `tech:`, `refactor:`, or `maintenance:`.
3. If installed through the Git marketplace, pushing to `main` updates its source. Refresh that installation with:

   ```sh
   codex plugin marketplace upgrade evan-skills
   codex plugin add estack@evan-skills
   ```

4. If installed through the private published plugin, use Plugin Creator's `update-plugin` skill. Inspect plugin `plugins_6abd8639d7348191b31c1430745b5d94`, package the changed Estack files with their relative paths, and call `update_plugin` with the observed current release ID. Read back the release to verify it. Uploads overlay existing files and cannot delete them.
5. Codex downloads private plugin updates automatically. Verify the local plugin version and changed files against the release. Report publication and local installation separately if Codex has not downloaded it yet. Never edit plugin caches or install standalone skill links. Start a new chat to load updated guidance.

6. For Devin, Factory, and Cursor releases, follow the target variant's README for native plugin installation and refresh. Git source changes require a push. Verify the installed package separately from the repository version. Do not install or refresh a target tool unless requested.
