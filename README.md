# skills

these are the skills i use to get work done with agents :)

built on lauren tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack), with my personal defaults and airgoods workflows. estack has separate editable plugins for codex, cursor, devin, and factory.

## install codex

install the private [estack plugin](https://chatgpt.com/plugins/plugins_6abd8639d7348191b31c1430745b5d94), or use the repo marketplace:

```sh
codex plugin marketplace add evan-mavis/skills --ref main
codex plugin add estack@evan-skills
```

## install cursor

import `https://github.com/evan-mavis/skills` from Cursor Customize using **From GitHub Repository**, then install `estack-cursor` from `evan-skills`. disable the separate pstack plugin to avoid overlapping skills.

pin `/estack` as a Custom Mode to keep it active throughout the chat. this variant includes the same skills, airgoods workflows, verification maps, and logo, with native Cursor agents.

see [the cursor readme](estack-cursor/README.md) for local installation and runtime limits.

## install devin

from this checkout:

```sh
devin plugins install --local ./estack-devin
```

after the variant is pushed to github:

```sh
devin plugins install evan-mavis/skills#estack-devin
```

see [the devin readme](estack-devin/README.md) for activation and runtime limits.

## install factory

from this checkout:

```sh
droid plugin marketplace add .
droid plugin marketplace list
droid plugin install estack-factory@evan-skills --scope user
```

use the registered marketplace name shown by `list` if it differs from `evan-skills`. after the variant is pushed, use `droid plugin marketplace add evan-mavis/skills` as the marketplace source.

see [the factory readme](estack-factory/README.md) for activation and runtime limits.

## routing

invoke or pin Estack using your tool's native syntax. it reads personal defaults, the matching project context, and then poteto-mode in full. the selected playbook and applicable principles still govern the work.

project context lives in [estack's references](estack/skills/estack/references/projects/). Airgoods is matched by repository identity, including worktrees and explicitly targeted PRs. other repositories use the generic workflow. add another project's context and a row in each variant's Estack project table to extend routing. project context is a reference, not another skill to invoke.

## skill tree

each directory contains a `SKILL.md`. all four variants share these skill names; tools and runtime instructions differ by platform. supporting files are omitted here.

```text
estack/
└── skills/
    ├── architect/                                           # Sketch types, signatures, and modules before implementation.
    ├── arena/                                               # Compare parallel candidates and combine their strongest parts.
    ├── automate-me/                                         # Capture working preferences in a personal mode skill.
    ├── babysit-airgoods-pr/                                 # Bring an Airgoods PR to a green, merge-ready state.
    ├── benchmark-checklist/                                 # Check that performance measurements reflect real, repeatable work.
    ├── blast-radius/                                        # Find what a change could break and verify its safety.
    ├── bro/                                                 # Restate the last message in plain language.
    ├── close-release-issues/                                # Audit released Linear issues and close them after user confirmation.
    ├── correct/                                             # Prevent recurring agent mistakes with enforceable safeguards.
    ├── create-verification-skill/                           # Build a project verification skill that exercises real behavior.
    ├── deslop/                                              # Remove AI-generated code clutter and clean up style.
    ├── estack/                                              # Route engineering work through poteto-mode with Evan's defaults.
    ├── figure-it-out/                                       # Design an auditable playbook when no narrower workflow fits.
    ├── grill-me/                                            # Stress-test a plan or idea through a structured interview.
    ├── how/                                                 # Explain a subsystem's architecture and runtime behavior.
    ├── interrogate/                                         # Have independent reviewers challenge code and design decisions.
    ├── maintain-airgoods-verification/                      # Maintain Airgoods verification skills and feature maps.
    ├── maintain-verification-skill/                         # Audit a project's verification skill against source and live behavior.
    ├── no-comments/                                         # Review code comments and fix accepted findings.
    ├── poteto-help/                                         # Explain Estack setup and choose a workflow for the task.
    ├── poteto-mode/                                         # Run engineering playbooks for substantive tasks.
    ├── principle-attack-the-premise/                        # Question a shared premise after repeated fixes fail.
    ├── principle-boundary-discipline/                       # Validate at system boundaries and trust internal types.
    ├── principle-build-the-lever/                           # Build a reusable tool to perform or verify the work.
    ├── principle-encode-lessons-in-structure/               # Turn recurring instructions into enforceable checks.
    ├── principle-exhaust-the-design-space/                  # Compare competing prototypes before choosing a novel design.
    ├── principle-experience-first/                          # Prioritize the user's experience in product tradeoffs.
    ├── principle-explain-the-number/                        # Identify what a measurement actually measures and what limits it.
    ├── principle-fix-root-causes/                           # Reproduce symptoms and fix their underlying cause.
    ├── principle-foundational-thinking/                     # Choose core types and data structures before writing logic.
    ├── principle-guard-the-context-window/                  # Keep bulk outputs out of the main conversation.
    ├── principle-laziness-protocol/                         # Prefer deletion and the smallest change that solves the problem.
    ├── principle-make-operations-idempotent/                # Make retries and partial runs converge on the same end state.
    ├── principle-migrate-callers-then-delete-legacy-apis/   # Migrate callers and delete the old API in the same change.
    ├── principle-minimize-reader-load/                      # Reduce indirection and hidden state in code.
    ├── principle-model-the-domain/                          # Encode domain rules in structures rather than scattered conditions.
    ├── principle-never-block-on-the-human/                  # Proceed with authorized reversible work without unnecessary approval.
    ├── principle-outcome-oriented-execution/                # Converge on the target architecture without throwaway compatibility code.
    ├── principle-prove-it-works/                            # Verify the real artifact before declaring the task complete.
    ├── principle-redesign-from-first-principles/            # Treat a new requirement as a foundational design assumption.
    ├── principle-separate-before-serializing-shared-state/  # Separate concurrent writers before adding synchronization.
    ├── principle-sequence-verifiable-units/                 # Break work into small steps that each end in a verified state.
    ├── principle-subtract-before-you-add/                   # Remove dead code and redundant checks before adding more.
    ├── principle-test-behavior-not-implementation/          # Test observable behavior against explicit expected results.
    ├── principle-type-system-discipline/                    # Use types to represent valid states and enforce domain constraints.
    ├── provision-neon-branch/                               # Manage an explicitly requested disposable Neon child with expiration and cleanup.
    ├── query-local-db/                                      # Query Airgoods development databases read-only.
    ├── query-prod-db/                                       # Query Airgoods production data read-only through Render.
    ├── recall/                                              # Reconstruct recent work from history and current state.
    ├── reflect/                                             # Review the active transcript and turn lessons into skill edits.
    ├── refresh-local-db/                                    # Refresh the local Airgoods database from a development parent or export.
    ├── reword/                                              # Rewrite text in Evan's warm, clear, lowercase voice.
    ├── setup-cloud-env/                                     # Set up or resume the Airgoods cloud development environment.
    ├── setup-droid/                                         # Set up or resume Airgoods on a persistent Factory Droid Computer.
    ├── setup-pstack/                                        # Choose model and reasoning settings for Estack workflows.
    ├── show-me-your-work/                                   # Keep a reviewable log of decisions, evidence, and results.
    ├── swarm/                                               # Run parallel workers and combine their results into one report.
    ├── tdd/                                                 # Use a failing test when requested or when a cheap local test fits.
    ├── teach/                                               # Explain how a body of work operates and why it was designed that way.
    ├── technical-writing/                                   # Apply plain technical writing standards to documentation.
    ├── to-linear-spec/                                      # Create or update a Linear feature spec and outcome-focused subissues.
    ├── typescript-best-practices/                           # Apply TypeScript guidance when reading or editing TypeScript.
    ├── ui-review/                                           # Capture UI evidence in Notion and apply review feedback.
    ├── unslop/                                              # Remove AI writing patterns and filler from prose.
    ├── verify-airgoods/                                     # Route live Airgoods verification to the appropriate app skill.
    ├── verify-airgoods-warehouse/                           # Verify the Warehouse operator app with recorded browser evidence.
    ├── verify-airgoods-web/                                 # Verify the marketplace web app with recorded browser evidence.
    ├── verify-airgoods-web-public/                          # Verify public web, CMS, and SEO behavior with recorded evidence.
    └── why/                                                 # Find evidence for design decisions and explain their tradeoffs.
```

## what's here

- [estack/](estack/) is the editable codex plugin, including shared workflows, my defaults, planning, and airgoods skills.
- [estack-cursor/](estack-cursor/) is the editable cursor plugin.
- [estack-devin/](estack-devin/) is the editable devin plugin.
- [estack-factory/](estack-factory/) is the editable factory plugin.
- [deprecated/](deprecated/) has archived workflows.

keep shared changes in sync across all four plugins according to [AGENTS.md](AGENTS.md). there are no generated packages, override layers, or shared symlinks.

```sh
bun scripts/check-estack.mjs
bun scripts/check-estack.mjs cursor
bun scripts/check-estack.mjs devin
bun scripts/check-estack.mjs factory
```

`scripts/install.sh` is the legacy shared-skill installer. it exposes codex skills through `.agents/skills`, which other tools can also discover. use native plugin installation for these variants. existing global links may need removal to avoid loading both versions.
