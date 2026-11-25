### Feature

**You own the design. Plan, review, verify.** Delegate implementation. Stay in the lead.

1. `how` over the affected subsystem.
2. `architect` for parallel design exploration.
3. Before building UI, read the design-decisions section of the Linear spec and confirm the design is approved. When the section is missing or still lists the UI question as open, settle it with a `prototype` first and do not start the UI build until a variant is chosen. Work with no visible UI change proceeds without it. A visual change made without the prototype follows the design-critic and ui-review pass before review.
4. Write the throughput checkpoint as four todo items. A dimension that genuinely does not apply (single file, no fan-out) keeps its item with `n/a: <reason>` rather than being dropped:
   - **Blocking first steps.** Gates run before fan-out.
   - **Independent workstreams.** Disjoint files, services, or layers parallelize. Shared writes serialize.
   - **Shared mutable state.** Default to splitting the target (the **separate-before-serializing-shared-state** principle skill). Serialize only for real invariants.
   - **Smallest safe decomposition.** If one worker is best, name why.
5. Delegate code-writing to a subagent using the inherited parent model unless the user requests an available model with a specific scope (file paths, named data shape and its organizing structure per **principle-model-the-domain**, a state machine over scattered booleans, a table/registry over branching, a typed model over repeated shape assumptions, chosen before the delegate writes logic, and success criteria). When the implementation admits multiple valid shapes (error handling, abstraction layer, test structure), delegate via the **arena** skill instead so the runners surface the alternatives and the cross-judge guards the pick. Mandatory: no skip-with-reason escape, and Laziness Protocol does not override it (the gain is review separation, not lines saved). A subagent forbidden to spawn satisfies this by owning the diff directly with the same review separation. No "standing by" reply that waits on a nested agent. Comments per **Comments**. Surgical edits, re-ground against the source for upstream-derived files. Port shared-primitive improvements to all consumers and verify each. Commit liberally.
6. Verify on the matching surface. "Inconclusive" or wrong-surface is not a pass. Flag it.
7. Keep small, logical verified commits on one integration branch for a coupled large feature. Continue QA and the user's UI, database, and query refinements there. State and satisfy the [readiness contract](../SKILL.md#large-feature-delivery) before final PR packaging.
   Use the **sequence-verifiable-units** principle skill, building, verifying, and committing each small unit before the next. Phase and commit boundaries do not prescribe PR boundaries.
8. If the design is contested, `interrogate` before shipping.
9. At readiness, run **Opening a PR** to package the fewest coherent reviewable PRs. A small task can use one PR. Honor an explicit request for early independent delivery.

Code-coupled work (one feature, one migration) goes to a single owner with the checkpoint inline. That owner fans out internally after the blocking phase. Parent-level fan-out is for slices that produce independent artifacts (audits, cross-subsystem investigations, competing experiments). Rewrite the checkpoint at phase boundaries. Spawn a fresh owner rather than chaining interrupts.

**Reply:** what you built, what you chose and why, the throughput checkpoint, open decisions. Tables for design alternatives.
