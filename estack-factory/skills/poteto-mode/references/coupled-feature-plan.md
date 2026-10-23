# <Feature> plan

<What changes, for whom, and the implementation unit ids in dependency order.>

## How to read this

**Delivery mode.** coupled-feature

One box is one unit of work. Every box names the evidence that checks it. Check a box only when its evidence exists, such as a test result, screenshot, or SHA. Implementation units are verified commits on one integration branch. Final PR boundaries are chosen at readiness.

Run `skills/poteto-mode/playbooks/autopilot-stack.md` in coupled feature mode. Follow its audit protocol and safety rules. <Who decides readiness and who owns final landing.>

Tests alone are not sufficient verification. A work unit is verified only when its unit, live, and perf boxes are all checked.

## Program checklist

### Arm the program

- [ ] Record the exit predicate and this plan in the decision trail. <Acceptance criteria and required evidence.>
- [ ] Read the bundled workflow files for Autopilot-stack, Opening a PR, swarm, and the selected project verifier.
- [ ] Follow the 30-minute audit protocol in Autopilot-stack. Send a status message for changed facts and record receipts.
- [ ] Honor existing execution and delivery instructions. Stop for a plan-only request, explicitly reserved acceptance, unresolved product decisions, or a safety gate.

### Spawn owners

- [ ] Assign one integration writer. Give concurrent workers isolated temporary branches and worktrees, bounded files, and required independent reviewers under the host's delegation rules.
- [ ] Follow this dependency graph. <Unit ids and dependencies.>
- [ ] Workers return verified commits and receipts without public feature PRs or stack mutations.

### Integration mechanics

- [ ] Integration branch. `<integration-branch>` starts at `<resolved-default-base-sha>` and stays canonical through implementation and QA.
- [ ] Readiness. <Acceptance criteria, required evidence, who decides, and the existing delivery instruction or reserved acceptance.>
- [ ] Refinements. Keep the user's UI, database, and query refinements on the integration branch until readiness.
- [ ] Commit each logical verified unit. Run the repository gates and deslop before commit, and no-comments before independent review.
- [ ] Integrate worker commits with one writer and reverify the combined state before dependent work proceeds.

### Verdict and integration

- [ ] Verify at the integration head using the gates, live, regression, perf, and independent audit lanes required by Autopilot-stack. Each required lane must pass. Findings return to the integration branch.
- [ ] Record the exact validated integration SHA and evidence after final QA and refinements. Any changed patch invalidates affected proof under `playbooks/shipping.md`.

### Boot recipe

- [ ] Use isolated checkouts at the exact integration SHA for verification. <Boot commands and real-surface driver.>
- [ ] Run the selected project verifier with available Factory browser or terminal tools. Save receipts under `<evidence-path>`.

### Package for review

- [ ] Packaging. After the readiness contract is satisfied, group the stable diff into the fewest coherent reviewable PRs under Opening a PR. No one-to-one mapping from commits or phases to PRs.
- [ ] Boundaries. Run build and relevant tests at every proposed PR tip against its exact parent, including migration and application compatibility. Regroup a failing boundary. <Commands and receipt paths.>
- [ ] Final tree. Run final product checks and `git diff --exit-code <validated-integration-sha> <stack-tip>`. Compare `git rev-parse <validated-integration-sha>^{tree}` and `git rev-parse <stack-tip>^{tree}`. Record equal tree IDs and exact SHAs before delivery. Revalidate integration after base drift.
- [ ] Open ready PRs after local boundary checks pass. Verify CI and native stack membership and order at the delivered heads.
- [ ] Landing. Deliver for human review. No merge or auto-merge. Preserve safety gates and separate merge authorization.

## <Task as a verb phrase> (<unit-id>)

**Depends on.** <Unit id, or None.>

**Files.**

- [ ] <Paths to edit, create, or delete.>

**Build.**

- [ ] <Concrete change and named data shape.>

**You see.**

- [ ] <Observable result.>

**Verify, unit.** Tests alone are not sufficient verification. A work unit is verified only when its unit, live, and perf boxes are all checked.

- [ ] <Test and command.>

**Verify, live.** Tests alone are not sufficient verification. A work unit is verified only when its unit, live, and perf boxes are all checked. Ten lanes on `<inherited parent model or user-requested available model>` at the integration head.

- [ ] Lane 1. Regression against trunk. <Same load-bearing scenario at trunk and integration head. Record absent behavior rather than invent a trunk result.> Save `<evidence-path>/lane-1.png`. Pass when <predicate>.
- [ ] Lane 2. <Scenario and real-surface driver.> Save `<evidence-path>/lane-2.png`. Pass when <predicate>.
- [ ] Lane 3. <Scenario and real-surface driver.> Save `<evidence-path>/lane-3.png`. Pass when <predicate>.
- [ ] Lane 4. <Scenario and real-surface driver.> Save `<evidence-path>/lane-4.png`. Pass when <predicate>.
- [ ] Lane 5. <Scenario and real-surface driver.> Save `<evidence-path>/lane-5.png`. Pass when <predicate>.
- [ ] Lane 6. <Scenario and real-surface driver.> Save `<evidence-path>/lane-6.png`. Pass when <predicate>.
- [ ] Lane 7. <Scenario and real-surface driver.> Save `<evidence-path>/lane-7.png`. Pass when <predicate>.
- [ ] Lane 8. <Scenario and real-surface driver.> Save `<evidence-path>/lane-8.png`. Pass when <predicate>.
- [ ] Lane 9. <Scenario and real-surface driver.> Save `<evidence-path>/lane-9.png`. Pass when <predicate>.
- [ ] Lane 10. <Scenario and real-surface driver.> Save `<evidence-path>/lane-10.png`. Pass when <predicate>.

**Verify, perf.** Tests alone are not sufficient verification. A work unit is verified only when its unit, live, and perf boxes are all checked.

- [ ] Metric. <Metric at trunk and head, or absolute budget for added behavior and the user-visible end state when trunk lacks the feature.>
- [ ] Probe. <Interleaved command at trunk and head.>
- [ ] Baseline. <Trunk value measured first, or evidence that trunk lacks the feature.>
- [ ] Rule. <Failure threshold without ratios between unlike scenarios.>

**Review gate.** <Reserved acceptance or existing readiness authority.>

- [ ] Save screenshots and video for the operator. <Artifact paths.>
- [ ] Apply the readiness contract to the evidence. Continue user refinements on the integration branch. Wait only for acceptance the operator reserved.

**Integrate.**

- [ ] Record the verified commit and resulting integration SHA. Run dependent checks there. Do not open a feature PR for this unit.

## Close the program

- [ ] Every required box has evidence. The final PR boundaries pass and the delivered stack tip tree equals the validated integration tree.
- [ ] Deliver the PR links, boundary verdicts, readiness evidence, and any remaining blockers.

## Appendix A. Prototype evidence

<Questions answered, artifacts, branches, SHAs, and questions still open.>

## Appendix B. Risks and alternatives

<Risks, rejected alternatives, and evidence paths.>
