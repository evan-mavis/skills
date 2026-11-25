### Coordinate delivery

Use this playbook when the user explicitly hands delivery to a coordinator. Keep role names generic here. Resolve actual specialists from the coordinator's standing instructions, not from reusable skills. For a standalone task, use its normal Estack playbook.

1. Confirm kickoff and the authoritative issue.
2. Brief the design specialist and obtain the user's design approval.
3. Brief the builder and complete implementation.
4. Run design critique and visual review, then fix findings.
5. Run independent engineering review, then fix findings.
6. Run independent acceptance verification, then fix findings.
7. Verify the final evidence package and request per-PR merge approval.

#### Confirm kickoff and the authoritative issue

The planner owns context gathering, `grill-me`, and `to-linear-spec`. Plan approval records a planning decision only. Do not prototype or build from "approved" alone. A request such as "approved, send it to the coordinator to build" or "build this" is kickoff for the named scope. Record the exact authorization and source before dispatch. If kickoff reaches a specialist directly, that specialist sends the bounded authorization to the coordinator. Do not make the user relay it.

Use the existing delivery issue as the authoritative record. Keep the approved spec and design pointers, acceptance criteria, branch and current head, current stage and owner, evidence references, unresolved findings, and sourced approvals there. Update that record in place. Do not create parallel delivery issues or copy its mutable state into Drive, Captain notes, or a second tracker. Work threads and existing implementation subissues may link to it without duplicating its stage state.

After kickoff, the coordinator is the single status and priority entry point. Report the actual stage, last verified head, evidence received versus evidence checked, blockers, and next actor. "Dispatched" is not "passed". A waiting design approval is not implementation in progress. Cross-Captain work is not automatically part of the coordinator's crew.

#### Send a bounded brief

Read the current Capy docs for Captains, background work, and instructions before first dispatch. Inspect each destination with `tools.thread.get` or `tools.captain.get`. Use its current thread code or id with `message_agent`, not a stale title or assumed parent path. Read tools' current signatures before use.

Every brief includes:

- The authoritative issue and coordinator's exact return address.
- The stage, approved spec and design revisions, acceptance criteria, and exclusions.
- The repository, branch, exact head, builder owner, and evidence already gathered, including gaps.
- The relevant skills, allowed writes, proof obligations, stop conditions, and required return report.

The specialist reads Estack and follows its scoped-stage contract. A review request allows code reads and isolated verification, not code edits. The builder's crew owns engineering code and branch integration. Route accepted fix lists back to that owner rather than starting writers in specialist crews. A design prototype may use an explicitly bounded prototype worktree. It does not authorize application implementation.

Use `tools.thread.create` only when a new work thread is needed under the responsible Captain. Use read-only shared subagents for independent inspection, or isolated verification environments when required. Preserve independence from the builder. Messaging another Captain neither transfers its crew nor makes its reports automatically reach the coordinator. Require an explicit `message_agent` report to the supplied return address. A recipient in turn must explicitly forward a child's result after inspecting it.

For issue records, use `tools.issue.read`, `tools.issue.update`, and `tools.issue.comment` when the authoritative issue is a Capy issue. For an existing Linear delivery spec, discover the current Linear connector and update that same issue. Do not create a Capy shadow issue. Do not transfer issue ownership merely to dispatch a stage.

#### Run the stages in order

1. Have the design specialist apply `prototype` to unresolved design choices and use `design-critic` before presenting the candidates. Require real artifacts and decision pointers. Pause for the user's approval of a specific design revision before implementation. If the design skills or taste inputs are unavailable, report the gap rather than claiming design passed. For a feature without UI, record the evidence for a design-stage exemption and obtain the user's approval of that boundary.
2. Have the builder apply the relevant implementation playbook, tests, and `deslop` within the approved design and scope. Start from the selected prototype branch when appropriate. Keep one integration branch for coupled work. Use the repository's required checks and evidence, not only compilation.
3. Have the design specialist inspect the built head with `design-critic` and `ui-review`. Run visual review and in-scope correction rounds autonomously. Send concrete findings to the builder. Do not require another user approval for each cosmetic fix. Reopen design approval if the proposed correction materially changes the approved design or scope.
4. Have an independent engineering specialist apply `interrogate` and `blast-radius` to the actual diff and affected behavior. Require file-grounded findings and executed proof where the skill requires it. Send accepted findings to the builder. The builder's own second look does not satisfy independence.
5. Have an independent acceptance specialist apply the repository's own verifier and full affected user flows against the acceptance criteria. Require its environment and data preflight, negative cases, and regression coverage. Report each criterion as passed, failed, or blocked with evidence. Do not substitute a review summary or green CI for these journeys.

After design approval, continue within the approved scope without routine permission requests. Ask early for material scope or design changes, unresolved access, safety actions, or the repeated-failure limit below. These gates override general autonomy grants. Safety and merge permissions remain separate from delivery permission. If a required skill or repository verifier is missing, report the gap and obtain an authorized equivalent proof plan. Never mark that gate passed without its proof.

#### Handle failures without restarting delivery

Keep the failed stage current and record the finding, head, evidence, owner, and retry count on the delivery issue. Route the smallest root-cause fix to the builder. Re-run the failed gate and every affected downstream gate on the new head. Re-run upstream gates only when their assumptions changed. Preserve still-valid approvals and evidence with explicit scope. Never present old-head proof as current-head proof.

Allow at most two fix attempts for the same failure, excluding the initial failed run. If both attempts fail the same gate, stop writing fixes that assume the same cause. Apply `principle-attack-the-premise`, inspect the root cause independently, and report the evidence and a bounded recovery proposal to the coordinator. After that diagnosis, allow at most one recovery attempt within approved scope. Escalate to the user if it fails or if recovery needs a material change, access, or a safety action. Keep the original count through diagnosis. Do not reset the retry count by renaming the finding or starting another thread. Repeated identical infrastructure errors are an environment blocker, not a reason to restart the feature.

A material change reopens only the affected scope or design decision. Obtain sourced approval of that revision, then resume from the earliest invalidated gate. Do not silently expand scope or repeat the entire pipeline.

#### Verify evidence and close the handoff

Every specialist returns a verdict, exact inspected head, commands or journeys run, observed results, artifact references, unresolved findings, and authorization provenance. A direct user conversation counts as an approval source. Forward the user's exact words, thread or comment reference, timestamp, approved artifact revision, and limits to the coordinator. Distinguish plan approval, kickoff, design approval, scope changes, and merge authorization. Never widen one into another.

The coordinator reads the underlying logs, screenshots, recordings, diffs, and approval sources before accepting a stage. Check the head, target environment, criteria coverage, and result. Re-run missing or ambiguous proof through the responsible specialist. Do not claim tests ran from reports alone. Label unavailable proof as blocked and simulations as simulated.

At readiness, present the PR links and current heads, approved spec and design, acceptance results, independent engineering and visual verdicts, CI results, remaining risks, and private evidence links. Keep copied customer data out of public attachments. Resolve findings or state exactly what remains. Request the user's explicit approval for each named PR. Never merge or enable auto-merge from plan approval, kickoff, design approval, green CI, or a general autonomy grant. If approval reaches another specialist, forward its exact source, but the merge executor must still satisfy the host's explicit authorization requirement in its own conversation.

Immediately before merge, compare the current PR head with the reviewed head and authorized revision. A later push requires affected gates again and renewed approval for changes outside the user's exact authorization. Never treat approval for one revision as permission for arbitrary later changes.

**Reply:** Current stage, verified head and evidence, unresolved blockers, and the next actor. At completion, provide the evidence package and named per-PR merge ask. Do not claim a real end-to-end pilot from a synthetic handoff exercise.
