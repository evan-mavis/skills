---
name: "principle-sequence-verifiable-units"
description: "Apply to multi-step work (sweeps, migrations, runs of similar edits) and to how you stack commits and PRs. Break work into small units that each end in a verifiable state, check each before the next, and order delivery so the sequence proves itself to a reviewer."
---

# Sequence work into verifiable units

Order work as a sequence of small units, each ending in a state you can check, and don't advance until the current one is green.

**Why:** A break caught at the unit that caused it is cheap to localize. A break caught after a batch is buried, and you have already built further on a broken base. Sequencing those same units into a delivery a reviewer can replay turns "trust me" into "watch it go red, then green."

**Execution.** In a sweep, migration, or any run of similar edits, verify each change before starting the next. Each unit is a before/after bracket: known-good state, one change, run the check, then proceed. Rebase onto clean trunk first so every check measures against the real baseline. When a lever does the edits, the per-unit check is nearly free. Run it anyway.

**Delivery.** Keep logical verified commits in proof order. A failing test can precede its fix within a unit, but each final PR boundary must build and pass its relevant tests. For coupled large features, keep implementation, QA, and user refinements on one integration branch. At readiness, group the stable result into the fewest coherent reviewable PRs per [Opening a PR](../poteto-mode/playbooks/opening-a-pr.md). Do not map commits or phases one-to-one to PRs. Preserve independent-queue workflows and explicit early independent delivery. Verify each final boundary and require the stack tip tree to equal the validated integration tree.

The sequencing complement to the **prove-it-works** principle skill, which keeps each check real, and the **build-the-lever** principle skill, which makes the per-unit check cheap.
