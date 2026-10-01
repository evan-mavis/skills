# ai development workflow

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 40, "rankSpacing": 48, "padding": 14}}}%%
flowchart TB
  ORCH{{"Single ticket or larger feature?"}}

  E1["forge-issue<br/>bug · improvement · small feature"]

  subgraph PLANPATH["Plan"]
    direction LR
    P1["scope clarification"] --> P2["to-prd"] --> P3["to-slices"] --> P4["to-linear"]
  end

  E2["forge-build<br/>execute approved plan"]

  ORCH -->|"one ticket"| E1
  ORCH -->|"needs planning"| P1
  P4 --> E2

  subgraph PREFLIGHT["Preflight"]
    direction TB
    PF1["ambiguity interview"] --> PF2["runtime profile"] --> PF3["data review"]
  end

  E1 --> PF1
  E2 --> PF1

  subgraph RUNTIME["Runtime · pick one profile"]
    direction TB
    RT0{{"data_profile — choose one"}}
    R1["none"]
    R2["local · fixtures"]
    R3["hosted-db · host DATABASE_URL"]
    R4["local-preview · preview stack"]
    RT0 --> R1
    RT0 --> R2
    RT0 --> R3
    RT0 --> R4
    R1 ~~~ R2
    R2 ~~~ R3
    R3 ~~~ R4
  end

  subgraph IMPLEMENT["Implement · forge-build loops per slice"]
    direction TB
    I1["implement-slice"] --> I2["deslop"] --> I3["refactor-structure"] --> I4["harden-architecture"]
    NEXT{{"more slices?"}}
    I4 --> NEXT
    NEXT -->|yes| I1
  end

  subgraph VERIFY["Verify"]
    direction TB
    V1["run-ci"] --> V2["optional browser QA"] --> V3["optional video demo"]
  end

  subgraph DELIVER["Deliver"]
    direction TB
    D1["to-pr draft"] --> D2["babysit"]
  end

  CLEANUP["runtime cleanup<br/>teardown ephemeral infra"]
  YOU["you · review draft PR & merge"]

  PF3 --> RT0
  RT0 --> I1
  NEXT -->|no| V1
  I4 -->|"single ticket"| V1
  V3 --> D1
  D2 --> CLEANUP
  CLEANUP -.-> YOU

  classDef phase fill:#f5f5f5,stroke:#999,stroke-width:1px
  classDef orchestrator fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
  classDef entry fill:#eeeeee,stroke:#666,stroke-width:2px
  classDef human fill:#fff,stroke:#999,stroke-width:1px,stroke-dasharray: 5 5
  class PLANPATH,PREFLIGHT,RUNTIME,IMPLEMENT,VERIFY,DELIVER phase
  class E1,E2 orchestrator
  class ORCH entry
  class YOU human
```

## glossary

### plan

| skill       | one-liner                                                                                    |
| ----------- | -------------------------------------------------------------------------------------------- |
| `to-prd`    | turn approved context into `specs/<slug>/PRD.md` on the feature branch.                      |
| `to-slices` | split a prd into `specs/<slug>/issues/`, commit/push, optional archive.                      |
| `to-linear` | sync the monorepo `specs/<slug>/` plan and slice graph to linear.                            |

### orchestration

| skill         | one-liner                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------- |
| `forge-issue` | deliver one bug, improvement, or small feature — skips planning, goes straight to preflight. |
| `forge-build` | execute an approved multi-slice plan from `specs/<slug>/` for larger features that needed planning first. |

### implement

| skill                 | one-liner                                                            |
| --------------------- | -------------------------------------------------------------------- |
| `implement-slice`     | implement one scoped change and leave the diff uncommitted.          |
| `deslop`              | remove mechanical ai slop from the current diff.                     |
| `refactor-structure`  | improve folder layout, naming, and file cohesion in scope.           |
| `harden-architecture` | independently review and fix architectural or control-flow problems. |

### verify

| skill    | one-liner                                                                 |
| -------- | ------------------------------------------------------------------------- |
| `run-ci` | run the repository's relevant ci-equivalent checks without changing code. |

browser qa and evidence capture are orchestrated inside `forge-issue` and `forge-build`, not separate skills.

### deliver

| skill     | one-liner                                                                 |
| --------- | ------------------------------------------------------------------------- |
| `to-pr`   | create or update one draft pr with verification summary and evidence.     |
| `babysit` | keep an existing draft pr clean, green, and mergeable without merging it. |

### cleanup

agent teardown after delivery: delete neon branches, stop services, clear temp credentials. preserve local-preview stacks by default.

**human step (outside skills):** review the draft pr and merge when ready — orchestrators never mark ready or merge.
