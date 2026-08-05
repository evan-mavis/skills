# Output Schema

Human-visible closeout = **exactly one concise sentence**, then surface video when relevant.
No YAML dump. Persist runtime / `change_contract` in the working contract.

Sentence examples:

- Done: `Build finished: https://github.com/org/repo/pull/456`
- Blocked: `Blocked: bug not reproducible on hosted-db.`
- Scope gate: `Blocked: needs planning — run grill-me → to-prd → to-slices → to-linear → forge-build.`

**Video (when relevant):**

- `evidence_profile: video` or `bug_evidence: before_after_video` — after the sentence, render
  MP4(s) in chat when the host supports it (after clip required; before + after when both exist).
- If clips live only on the PR/Linear issue, put those links in the sentence or right after
  (e.g. `Build finished: <pr-url> — before: <url>, after: <url>`).
- Never omit required video that was produced.

No `done` wording when [invalid done](../../references/preflight-gates.md#invalid-status-done)
applies — say `Blocked: …` instead.
