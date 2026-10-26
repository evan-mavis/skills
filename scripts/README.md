# Validate Estack

Run these checks from the repository root with Bun, Node.js, and Java 11 or later:

```sh
bun scripts/check-estack.mjs
bun scripts/check-estack.mjs devin
bun scripts/check-estack.mjs factory
bun scripts/check-estack.mjs cursor
bun test scripts/*.test.ts
node --test scripts/ui-review.test.mjs
bun scripts/check-estack-loader.mjs
git diff --check
```

The loader check needs the Codex CLI. It creates an empty temporary `CODEX_HOME`
for its subprocess and deletes the fixture afterward. It does not copy credentials,
user configuration, or plugin caches. This uses Codex's documented
[configuration and state location](https://learn.chatgpt.com/docs/config-file/config-advanced#config-and-state-locations).
It checks skill discovery without installing Estack or making a model request.

For each variant, work in `<variant>/skills/poteto-mode/scripts` and run:

```sh
bun install --frozen-lockfile --ignore-scripts
bun test orch watch-pr
bun run typecheck
```

Set `TLA2TOOLS` to a verified `tla2tools.jar` from the official
[TLA+ releases](https://github.com/tlaplus/tlaplus/releases). Run
`node --test <variant>/skills/statechart/scripts/test/statechart.test.mjs` for each
variant. The CI workflow pins TLC 1.7.4 and verifies its SHA-256 before running it.
The suite reports missing TLC and unsupported PID-namespace tests as skips.
A run without TLC does not validate the model-checking paths.

## Native validation scope

The repository checker validates skill YAML, native invocation metadata, package
identity, paths, references, and platform boundaries for all four variants.

Cursor's official [metadata validator](https://github.com/cursor/plugins/blob/99b609a72323b70204eab407c622f436e858e112/scripts/validate-plugins.mjs)
and schemas can also run unmodified in a disposable copy containing this repository's
marketplace and Cursor package. This validates metadata, not live tool execution.

Devin documents an offline [template checker](https://docs.devin.ai/product-guides/plugin-ecosystem).
The official [plugin-template script](https://github.com/CognitionAI/plugin-template/blob/dd46026e57a228050b34c25961cdf9b82d5415bd/scripts/validate-plugins.mjs)
assumes `plugins/<name>/` and parses frontmatter by splitting lines at colons.
It rejects valid YAML flow mappings used here. It is not a general YAML or native
loader validator. Keep the repository's YAML checks; do not report the template
check as passing on these files. Devin does not document a standalone CLI plugin
validation command.

Factory's [plugin documentation](https://docs.factory.com/harness/plugins) says
Droid does not read or require fields inside `plugin.json`. Its marketplace supplies
plugin identity. Factory does not document a standalone plugin metadata validator.
`droid rules check` checks permission rules, not plugins.

Live Devin and Factory loading requires installing the target plugin. Structural
checks do not prove live loading. Do not install or refresh a target plugin without
authorization, and report this limit separately from unavailable CLI tooling.
