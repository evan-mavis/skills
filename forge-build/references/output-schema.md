# Output Schema

Human-visible closeout = **exactly one concise sentence**, then surface video when relevant.
No YAML dump or profile inventory. Persist profiles/QA/lifecycle under `## Forge Build Execution`
/ PRD sections.

Sentence examples:

- Done: `Build finished: https://github.com/org/repo/pull/123`
- Blocked: `Blocked: missing DATABASE_URL before dispatch.`
- Blocked mid-plan: `Blocked on <local-id>: <reason> (PR none).`

**Video (when `pr_evidence: video` or a demo/evidence MP4 exists):** after the sentence, render the
final demo in chat when the host supports it (path or artifact URL). If only a PR/Linear
attachment exists, include that link in the sentence or immediately after
(e.g. `Build finished: <pr-url> — demo: <evidence-url>`). Never skip mentioning video that was
required and produced.

No `done` wording when [invalid done](../../references/preflight-gates.md#invalid-status-done)
applies — say `Blocked: …` instead. Host git/action directives may follow after the closeout.
