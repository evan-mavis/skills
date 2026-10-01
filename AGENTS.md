# Agent instructions

`estack/` is the sole source of truth. Edit it directly.

## Edit skills

- Read the target skill and relevant references first. Make surgical, minimal, concise edits. Preserve pstack's intent, workflow, and safeguards. Avoid unrelated rewrites.
- Use `/unslop` when writing new skills or changing prose. Read `estack/skills/unslop/SKILL.md` and apply it.
- Preserve valid skill frontmatter and working links. Keep supporting files with their skill. Leave `deprecated/` alone unless requested.
- Check `git status --short` before editing. Run `bun scripts/check-estack.mjs`, the narrowest relevant tests, and `git diff --check`. For shell edits, run `bash -n`.
- Never commit credentials, host files, dependencies, or logs. Never weaken checks to make them pass.

## Release and update

Repository edits and plugin publication are separate. Publish only when the task includes a plugin update or release.

1. Bump the version in both `estack/plugin.json` and `estack/.codex-plugin/plugin.json`. Preserve plugin identity, permissions, and metadata.
2. Validate, commit, and push. Use a lowercase subject beginning with `feat:`, `fix:`, `tech:`, `refactor:`, or `maintenance:`.
3. If installed through the Git marketplace, pushing to `main` updates its source. Refresh that installation with:

   ```sh
   codex plugin marketplace upgrade evan-skills
   codex plugin add estack@evan-skills
   ```

4. If installed through the private published plugin, use Plugin Creator's `update-plugin` skill. Inspect plugin `plugins_6abd8639d7348191b31c1430745b5d94`, package the changed Estack files with their relative paths, and call `update_plugin` with the observed current release ID. Read back the release to verify it. Uploads overlay existing files and cannot delete them.
5. Codex downloads private plugin updates automatically. Verify the local plugin version and changed files against the release. Report publication and local installation separately if Codex has not downloaded it yet. Never edit plugin caches or install standalone skill links. Start a new chat to load updated guidance.
