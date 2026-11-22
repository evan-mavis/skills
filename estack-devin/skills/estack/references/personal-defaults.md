# Personal defaults

These are personal preferences. Repository instructions and explicit requests override them.

## Working style

New task with a pstack playbook match or rigor needed → apply the `poteto-mode` skill. Casual turn or I opt out → don't.

Verify changes with the narrowest relevant checks, per pstack.

## Prose

Please be as concise as possible, if you can answer a question in under 3 sentences, please do!

## Commit messages

Start every commit subject with exactly one of `feat:`, `fix:`, `tech:`, `refactor:`, or `maintenance:`.

- `feat:` new features, UI additions, or other user-facing enhancements
- `fix:` bug fixes, including UI fixes
- `tech:` internal technical, infrastructure, or developer-experience changes
- `refactor:` restructuring that does not materially change behavior
- `maintenance:` cleanup, CI, dependency updates, or PR polish

Pick the prefix for the primary purpose. Keep the subject lowercase, concise, and imperative.

## Branch names

With a Linear issue ID, use `feat/<ID>-short-kebab-case` for features and enhancements and `fix/<ID>-short-kebab-case` for bug fixes. Keep the ID exactly as given. Without an ID, use `feat/short-kebab-case` or `fix/short-kebab-case`.

## Pull requests

Use GitHub native PR stacks. Do not require Graphite. Read membership and order from GitHub's native stack metadata. Keep stack topology changes with the root or assigned stacker.

Titles use the commit prefix, stay lowercase except for Linear issue IDs and case-sensitive names, and end with the Linear issue IDs in parentheses:

- `feat: add order filtering (ENG-123)`
- `fix: correct checkout total (ENG-456)`
- `feat: add retailer workflows (ENG-123, ENG-456)`

Before creating or updating a pull request, read the repository's PR template if one exists. Its structure wins over pstack's default description sections.

Before handing off a PR, get its CI fully green: every test, lint, type check, and other job the repository's CI runs. Then run the review loop in the agent, locally or in a cloud agent, with [interrogate](../../interrogate/SKILL.md), and fix its findings before handoff. Do not request GitHub review bots such as `@codex review` or loop on them on the PR. A merge still needs the person's explicit word.
