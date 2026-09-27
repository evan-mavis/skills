# Local Worktree Runtime

Use when `host: local_worktree` and `data_profile: local-preview` against the Airgoods monorepo.

Load the repo skill at `.agents/skills/provision-local-worktree-environment/SKILL.md` and invoke
its helper from the worktree root:

```bash
bash .agents/skills/provision-local-worktree-environment/scripts/local-preview-worktree.sh provision
bash .agents/skills/provision-local-worktree-environment/scripts/local-preview-worktree.sh status
bash .agents/skills/provision-local-worktree-environment/scripts/local-preview-worktree.sh repair
bash .agents/skills/provision-local-worktree-environment/scripts/local-preview-worktree.sh delete --yes
```

Pass `--env NAME` when detached HEAD prevents branch-derived naming. Never create a git branch
merely to derive a name.

After provision: read `.previewctl.json` for non-secret branch metadata; use printed service URLs
for verification; run `pnpm dev` or the minimal stack required by the affected flow.

Never delete or reuse previewctl namespaces (`preview-local-*`, `preview-*`) from unrelated Neon
cleanup. Never invoke this skill on cloud hosts.
