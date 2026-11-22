# notes verification map

this directory is the maintained source for verifying the user-facing behavior of notes. read the index before driving the app, then use the matching feature file as the recipe.

## baseline preconditions

- launch notes at `http://127.0.0.1:4173` with a disposable data directory.
- set `NOTES_DATA_DIR=/tmp/notes-verify-$RUN_ID` so concurrent runs do not share state.
- seed notes titled `Quarterly plan` and `Grocery list`.
- put `control-notes` and the `notes` cli on `PATH`.
- run `control-notes doctor` and require the expected url, data directory, and build revision.
- never drive an instance that was not started by this verification run.

## driving conventions

- start every recipe from the baseline state unless its preconditions say otherwise.
- prefer aria roles and accessible names over css selectors or dom position.
- treat every command as literal. keep quoted names and flags unchanged.
- run browser actions through `control-notes browser`.
- run terminal actions through `control-notes cli -- <command>`.
- restore seeded data after a mutation. do not remove proof artifacts during cleanup.

## proof and skip reporting

- capture the user action and the resulting state, not only the final screen.
- ui proof includes an aria snapshot and a screenshot with the app identity visible.
- cli proof includes the command, stdout, stderr, and exit code.
- mutation proof includes a read-only second view of the stored value.
- record the feature id and entry point used with every artifact.
- report an unreachable path with the attempted command and the unmet precondition.
- do not report a skipped entry point as verified through a different path.

## feature entry contract

each feature file starts with an h1 title and one paragraph describing the user-visible behavior. it then uses exactly four h2 sections in this order.

1. `Sub-features` lists short ids with one line for each behavior.
2. `How to get to it (user POV)` lists every user entry point.
3. `Driving it with <harness>` starts with `Preconditions:` and uses labeled bullets that pair each user action with an exact command and observable result.
4. `Gotchas` lists traps that can waste or invalidate a verification run.

keep implementation details out of the map. name only user paths, stable handles, required state, commands, and observable proof.

## features

- [create a note](./create-note.md) covers browser and cli creation, cancellation, persistence, and cleanup.
- [search notes](./search.md) covers toolbar, keyboard, and cli search with matching, empty, and clear states.
