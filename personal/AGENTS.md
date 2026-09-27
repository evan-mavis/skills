# Personal defaults

These are personal preferences. Repository instructions and explicit requests override them.

## Working style

New task with a pstack playbook match or rigor needed → apply the `poteto-mode` skill. Casual turn or I opt out → don't.

Most pstack skills can't be invoked by the model on some hosts. When a pstack skill you need isn't in your skill list, read `~/.agents/skills/<name>/SKILL.md` in full and follow it. For poteto-mode, that's `~/.agents/skills/poteto-mode/SKILL.md`.

pstack skills are written for Cursor. Outside Cursor, when any pstack skill names a Cursor tool, path, or model, read `~/.agents/skills/poteto-mode/references/host-runtime.md` for the host equivalent.

Verify changes with the narrowest relevant checks, per pstack.

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

Titles use the commit prefix, stay lowercase except for Linear issue IDs and case-sensitive names, and end with the Linear issue IDs in parentheses:

- `feat: add order filtering (ENG-123)`
- `fix: correct checkout total (ENG-456)`
- `feat: add retailer workflows (ENG-123, ENG-456)`

Before creating or updating a pull request, read the repository's PR template if one exists. Its structure wins over pstack's default description sections.

## Airgoods

For an Airgoods GitHub pull request, when I ask to babysit it, get it green, make it merge-ready, address review comments, or check outstanding PR work, use the `babysit-airgoods-pr` skill. It supersedes generic pstack and host babysitting for Airgoods PRs. Do not invoke it merely because a PR was opened.
