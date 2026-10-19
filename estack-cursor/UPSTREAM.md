# pstack source history

This file records the pstack snapshot reviewed for Estack and its source adaptations. This editable Cursor variant is maintained with the other three variants under `AGENTS.md`. Historical entries describe the original Codex adaptation.

## Snapshot

- Version: `0.15.28`
- Commit: [`d457567332aa6989e753ea289f30ea2bfbc80bc0`](https://github.com/cursor/plugins/commit/d457567332aa6989e753ea289f30ea2bfbc80bc0)
- Retrieved and compared: 2026-10-19
- Sources: `pstack/` and `cursor-team-kit/skills/deslop/`
- Previous snapshot: `0.15.26` at [`0b8e952052d482ee6de06deebf14d590d77b1b34`](https://github.com/cursor/plugins/commit/0b8e952052d482ee6de06deebf14d590d77b1b34), compared 2026-10-18.
- Earlier snapshot: `0.15.25` at [`e5136d82418d2db3165ea1050d17577cd618cc05`](https://github.com/cursor/plugins/commit/e5136d82418d2db3165ea1050d17577cd618cc05), compared 2026-10-15.

## Shared source history

- Estack skills and playbooks retain their shared workflows and Airgoods safeguards. This file preserves the shared source history.
- `skills/poteto-mode/SKILL.md` uses the lowercase skill name `poteto-mode`.
- PR titles and branch names follow the bundled personal defaults.
- `skills/deslop/` is vendored from the source snapshot and runs before commits.
- The Codex variant preserves the source license and includes its runtime adaptations directly.
- Codex session hooks adapt [Aqua's Codex port](https://github.com/Aqua-123/pstack-for-codex/tree/main/hooks), with Estack activation forms and state isolated by chat and project. `NOTICE-hooks` preserves the source license. Generic Codex subagents continue to use the bundled poteto-agent prompt; no custom agent profile is installed.

### Adopted from 0.15.6 through 0.15.10

- `benchmark-checklist` and `principle-explain-the-number` vet performance claims. The benchmark checklist supports both Linux and macOS core-count commands. Perf issue and Hillclimb use it before acting on measurements and prefer cheaper changes first.
- `correct` fixes proven repeated mistakes through architecture, types, lint, CI, or tests before adding prose rules. Codex history must be accessible, and fixes remain within the requested scope. A correction outside this workflow does not automatically authorize repository changes.
- Architect screens for split ownership, duplicate ways to perform a task, importable internals, and lists that need manual synchronization. The TypeScript cast example now validates the whole shape with a schema.
- Poteto-mode starts fresh subagents for new work unless costly live state requires reuse. Its agent prompt, Swarm retries, and Autopilot-full queue handoffs agree. Autopilot owners push after each verifiable unit, and audits check the pushed branch and decision trail.
- Default decisions accept replies in plain words. PR descriptions use separate headings, a short change list, explicit scope, and concise validation. Repository templates still win. Purpose-built PR tools take precedence for supported operations, and created PRs attach to the Codex task.
- The Codex `poteto-help` routes help questions to bundled Estack skills. It explains Codex model inheritance, activation hooks, real runtime evidence, Airgoods overrides, and authorized scheduling. Its shorter map replaces upstream's Cursor setup instructions and guide links.

### Adopted from 0.15.11 through 0.15.20

- Verification-skill launch reaches a usable state with migrations and seed data. Missing journey preconditions fail explicitly. Setup supplied by a stand-in stays unverified on the real target.
- The receiving chat owns poteto-mode's playbook, progress, and delegation. Poteto-agent handles delegated tasks. Native platform tools and delegation limits remain intact.
- `ketchup` gives a read-only catch-up with current PR, CI, and agent state, pending user decisions, and comparisons from real evidence. Invocation syntax uses each host's conventions. Normal discovery remains available.
- The PR watcher paginates review threads and counts Bugbot passes across all pages. The new page type replaces the old single-query reader in every caller and test.
- The plan checker tracks fence character and length, so nested backticks, tilde fences, and indented fences cannot expose example headings as plan sections. Estack's verification markers and audit cadence remain unchanged.
- Worktree audits accept `--base <ref>`, fetch the selected origin branch with an explicit refspec before validating it, and print the checked base. Estack already resolves `origin/HEAD`. Keep its refusal to guess and each host's usage-ownership safeguards.

### Not adopted from 0.15.11 through 0.15.20

- Skip Cursor model defaults, model-rule setup prompts, typed-only help, and the root manifest. Estack already has native manifests and its own model and invocation policy.
- Skip broad prompt distillation, guide expansion, and copied help recipes. They remove useful workflow constraints or repeat existing guidance without proof of a benefit on Estack's hosts.
- Keep Unslop's existing description and discovery policy. Its automatic use is intentional in Estack. The Cursor-specific agent-name workaround is already covered by Estack's lowercase `comment-sicko` identifier.
- `cursor-team-kit/skills/deslop/` has no changes since the previous snapshot. Account release IDs, personal defaults, Airgoods overrides, artwork, licenses, and runtime safeguards stay unchanged. No plugin is published or installed by this sync.

### Adopted from 0.15.21 through 0.15.24

- The PR watcher classifies an owner-approval `ACTION_REQUIRED` Code Review Gate as its distinct gate kind on both read paths. Other CI checks in that state still fail. Behavior and regression tests match upstream. The classifier has an explicit name and no redundant comment.
- Worktree audits prefer readable Origin PR data and fall back to GitHub. Normalize open and draft PRs into protected buckets. Adapt upstream to fall back on malformed data as well as CLI failures. Keep each host's session and ownership checks.
- `in-your-own-words` restates the user's goals and problem. `sharpen` improves a task's approach and keeps an independent check. Both require explicit invocation through native metadata. Sharpen preserves user constraints and leaves product choices with the user.
- Delegate prompts include the resolved bundled poteto-mode path. Root-cause investigations propose a cheap persistent signal when finding the decisive fact took a deep investigation.
- Ketchup reports changes that matter to the user, checks numbers, avoids invented decisions, and aims for a brief reply without dropping decision context. Comparisons remain flexible and use existing evidence.
- Autopilot rebase pushes pin the lease to the expected remote SHA and stop on unexpected remote writes. Audits distinguish a pending decision from a stall. Autopilot-stack reserves rebases and PR topology for the root. Orchestrate workers and verifiers cannot retarget or merge. Shipping confirms that a merge landed on trunk.

### Skipped from 0.15.21 through 0.15.24

- Keep Graphite's tracked stack as Orchestrate's authority. Upstream's forge-base-chain replacement can use drifting PR bases and guesses `main` when default-branch resolution fails. Its CLI and store rewrite is not imported.
- Keep native model inheritance and reasoning defaults. Skip upstream model-family aliases, adaptive effort, and fast-mode policy.
- Keep detailed per-round proof, CI, patch-id, merge-prep, and bottom-frontier safeguards. Skip broad playbook cuts and weaker minor-fix review rules. Keep the 30-minute audits and native scheduling.
- Skip mandatory Ketchup pictures and fixed box limits. Keep evidence-based tables and diagrams. Do not make a quiet audit produce a routine status message.
- Cursor slash-menu instructions and Cursor-specific discovery paths do not apply to the other hosts. Existing native invocation and profile metadata already omit retired fields. Deslop has no changes since the previous snapshot.

### Adopted from 0.15.25 and the following principle revision

- Attack-the-premise tests the shared assumption directly instead of requiring an actor census. Failed fixes are evidence to check, not proof that the premise is false. Fix-root-causes distinguishes legitimate states from invalid states before deciding whether a guard is the fix. Reproduction, pattern searches, and cheap diagnostic signals remain.
- Make-operations-idempotent derives each step from current state and requires evidence of stale artifacts instead of prescribing PID locks. Test-behavior-not-implementation tests observable contracts, including external effects, against broken behavior and harmless internal refactors. Keep exact error-message checks when wording is part of the contract. Correct and the principle index agree.
- Ketchup explains each change and embeds existing screenshots or video inline when useful. Diagrams explain relationships and flows. Keep action items in text, brief replies, and read-only evidence gathering. Skip mandatory pictures, fixed box counts, and a separate visual word allowance.
- Deslop has no changes since the previous snapshot. Upstream README and guide summaries are covered by the updated principle index and skill descriptions; Estack's native README layouts remain.

### Reviewed after 0.15.25

- Adopt upstream `99743e9`'s removal of the suggestion that more than five actionable findings means poor filtering. Judge each finding by evidence and impact. Keep reviewer context, security scrutiny, and reasons for dismissed findings.
- Keep the rules for complete migrations, type-system examples, bounded worker count, and explicit result gaps. Skip broad deletions that remove useful guidance and minor cuts with no clear workflow gain. Native tools and invocation policies stay unchanged. Deslop has no changes since the previous snapshot.

### Reviewed through 0.15.26

- Add `create-formal-verification-skill` and its help route. Preserve code-to-proof mapping, actual atomic operations, explicit bounds and assumptions, broken-variant checks, unchanged findings, and one rerunnable command with a reproducible tool version. Generated skills use each host's project skill directory and name their real project scope in the description and opening instructions.
- Preserve the new skill's explicit-only policy through Codex `agents/openai.yaml`, Devin `triggers: [user]`, and Factory and Cursor `disable-model-invocation`. Invocation syntax stays native to each host.
- Ketchup lists every pending item with its meaning, evidence, risk, link when available, and recommendation. Unknown facts remain explicit. The reply can grow beyond a word budget. Keep the main story brief, read-only gathering, normal discovery, and optional visuals from existing evidence. Skip mandatory pictures and fixed box counts.
- Adopt the TypeScript brand example's verifying type guard and remove its assertion. Keep existing schema and boundary rules.
- Skip Claude packaging, generated harness trees, root manifest changes, broad guide rewrites, and name-only fixes already satisfied here. Skip upstream `scripts/check-pstack-docs.mjs`, which checks its guide, Custom Modes, and model setup. Native inventory, reference, and metadata checks cover the applicable package rules. The `make-bot-ui` change only renames a skill Estack does not ship and adds no workflow. Native metadata, runtime safeguards, personal defaults, Airgoods overrides, artwork, licenses, and account release IDs stay intact. Deslop has no changes since the previous snapshot.

### Reviewed through 0.15.28

- Add `maintain-formal-verification-skill` to trace covered changes, update verification from the code, and separate stale checks from code bugs. Preserve atomicity, bounds, counterexample replay, broken-code checks, and findings. Use isolated scratch checkouts. Record uncommitted covered changes without advancing the sync commit. Maintain generated-input fallbacks too, preserving their testing label and input limits. Preserve each host's explicit invocation metadata.
- Creation records covered files, functions, and a verified sync commit, then routes later drift to maintenance. Start ordering models with TLA+ unless a suitable checker already exists. If no code verifier fits, test real code with generated inputs and label the result as testing rather than proof.
- Setup offers formal verification once when absent and runs it only on acceptance. Help routes missing or stale checks to the matching workflow. Sharpen drops the rewritten-prompt ban while retaining actual task execution and user constraints.
- Skip upstream guide expansion, copied recipes, Claude installation instructions, and model-rule setup. Native setup, help, and manifests already cover those needs. Deslop has no changes since the previous snapshot. Personal defaults, Airgoods overrides, native tools, scheduling, hooks, session safeguards, artwork, licenses, and account release IDs stay intact.

### Estack review fixes

- PR #7 review found the approval-gate exception stopped at check parsing. Carry it through the aggregate merge assessment so an owner-approval gate can explain `BLOCKED` with rollup `FAILURE`. Preserve real CI failures and unexplained refusals. Snapshot and classifier tests cover both read paths.
- Isolate the audit test's `CODEX_HOME` in its temporary fixture. Tests must not scan the host's real session tree. Production Codex session checks and the other hosts' ownership safeguards remain unchanged.

### Deliberately retained or skipped

- Keep Codex model inheritance, session hooks, goal-tool authorization, bounded waits, and the existing 30-minute automation audit cadence. Do not import Cursor Custom Modes, `/loop 1h`, `.mdc` model rules, Cursor agent types, or Cursor cloud-only tools.
- Keep the current merge-prep rebase and patch-id safeguards. Skip the new Autopilot-full optimization that can avoid another rebase when trunk moves.
- Keep technical-writing source attribution. Upstream's removal of the attribution lines adds no workflow benefit.
- Personal defaults, Airgoods overrides, the custom logo, licenses, and account release identifiers remain unchanged. This source sync does not publish the private plugin.

## Cursor adaptation

The native manifest, agent routing, and skill layout were checked against the pstack snapshot above. Shared Estack prose, playbooks, supporting files, personal defaults, and Airgoods verification maps come from the maintained variants. Host-specific sections use current Cursor documentation.

- Custom agents use `model: inherit`. User-requested alternatives require an available model and a verified effective selection. Hardcoded upstream model IDs and per-role settings are not imported.
- Cursor's Custom Mode holds the selected skill in chat context. `icon` and `color` style it. Obsolete `mode` and `reminder` fields are omitted. The reviewed upstream snapshot contains no hook code. This variant ships no activation hooks.
- Task delegation permits direct children and grandchildren where available. Deeper requests return to the parent. Factory's flat-only delegation and automation API names are omitted.
- Browser verification resolves native Cursor tools or an installed driver. Video proof preserves the shared agent-browser recording recipe. Scoped host transcripts replace Codex's private JSONL schema.
- Cursor automations start separate cloud agents. Persist and verify ledger access and context tools before claiming a durable follow-up. The external Airgoods GitHub Codex reviewer keeps its identity and safeguards.
- The same artwork is declared through Cursor's supported `logo` field. Repository marketplace metadata points at `estack-cursor/`. No other plugin is required.
