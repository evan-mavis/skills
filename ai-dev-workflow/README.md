# AI Dev Workflow

Full e2e AI workflow for shipping features!

## Skills

| Skill                                  | Role                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| **grill-me**                           | Get agent and human on the same page — eliminate ambiguity                    |
| **to-prd**                             | Master agent-optimized plan — full feature context for downstream agents      |
| **to-issues**                          | Break PRD into issue slices                                                   |
| **to-linear**                          | Sync local plans to Linear                                                    |
| **forge-issue**                        | Pick and implement the next slice (single, handoff, or parallel subagent PRs) |
| **deslop**                             | Clean AI slop from uncommitted changes                                        |
| **thermo-nuclear-code-quality-review** | Strict maintainability review before merge                                    |
| **merge-worktree**                     | Merge parallel handoff branches locally (Path B)                              |
| **to-worktree-pr**                     | Open parallel sub-issue PR from worktree branch (Path C)                      |
| **run-ci**                             | Run local typecheck, lint, test, format                                       |
| **to-pr**                              | Open feature PR to development                                                |
| **babysit**                            | Triage PR comments and CI until merge-ready                                   |

## Workflow

```mermaid
flowchart TB
  GM["grill-me"]
  PRD["to-prd"]
  ISS["to-issues"]
  LIN["to-linear"]
  FORGE["forge-issue<br/>pick next unblocked slice"]

  GM ==>|"get agent + human on same page<br/>(eliminate ambiguity)"| PRD
  PRD ==>|"creates PRD.md"| ISS
  ISS ==>|"creates issue-NNN.md<br/>+ 00-index.md"| LIN
  LIN ==>|"syncs to Linear<br/><i>optional</i>"| FORGE

  PRD -.- OUT1["plans/in-progress/&lt;slug&gt;/PRD.md"]

  subgraph LOCAL["Local issue files"]
    direction TB
    OUT_IDX["00-index.md"]
    OUT_I1["issue-001.md"]
    OUT_I2["issue-002.md"]
    OUT_I3["issue-003.md"]
    OUT_IN["issue-N.md …"]
  end

  subgraph LINEAR["Linear issues"]
    direction TB
    LIN1["AIR-101"]
    LIN2["AIR-102"]
    LIN3["AIR-103"]
    LINN["AIR-N …"]
  end

  ISS -.- OUT_IDX
  LIN -.- LIN1

  subgraph PATH_A["Path A — single thread"]
    direction TB
    PA1["implement on feature branch"]
    PA2["deslop"]
    PA3["thermo-nuclear review"]
    PA1 ==> PA2
    PA2 ==> PA3
  end

  subgraph PATH_B["Path B — parallel handoff"]
    direction TB
    PB1["generate paste-ready prompts"]
    PB2["new chat thread: implement slice"]
    PB3["deslop"]
    PB4["thermo-nuclear review"]
    PB5["merge-worktree"]
    PB1 ==> PB2
    PB2 ==> PB3
    PB3 ==> PB4
    PB4 ==> PB5
  end

  subgraph PATH_C["Path C — parallel subagent PRs"]
    direction TB
    PC1["main thread: create worktrees<br/>+ spawn sub-agents"]
    PC2["sub-agent: implement slice"]
    PC3["deslop → commit → push"]
    PC4["to-worktree-pr"]
    PC5["merge parallel PR on GitHub"]
    PC6["main thread: pull + refresh index"]
    PC1 ==> PC2
    PC2 ==> PC3
    PC3 ==> PC4
    PC4 ==> PC5
    PC5 ==> PC6
  end

  FORGE ==>|"single"| PA1
  FORGE ==>|"parallel-handoff-prompts"| PB1
  FORGE ==>|"parallel-subagent-prs"| PC1

  JOIN(["all slices on feature branch"])

  PA3 ==> JOIN
  PB5 ==> JOIN
  PC6 ==> JOIN

  subgraph UNIFIED["Unified — when feature ready"]
    direction TB
    U0["thermo-nuclear review"]
    U1["run-ci — lint, test, format"]
    U2["to-pr — feature PR → development"]
    U3["babysit — triage CI & reviews"]
    U0 ==> U1
    U1 ==> U2
    U2 ==> U3
  end

  JOIN ==> U0

  classDef skill fill:#e8f4fc,stroke:#1a73e8,stroke-width:2px
  classDef output fill:#fff,stroke:#ccc,stroke-dasharray:3 3
  classDef unified fill:#d4edda,stroke:#155724,stroke-width:2px
  class PRD,ISS,LIN,FORGE,GM skill
  class OUT1,OUT_IDX,OUT_I1,OUT_I2,OUT_I3,OUT_IN,LIN1,LIN2,LIN3,LINN output
  class JOIN,U0,U1,U2,U3 unified
```
