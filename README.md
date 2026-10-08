# skills

these are the skills i use to get work done with agents :)

built on lauren tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack), with my personal defaults and airgoods workflows. estack has separate editable plugins for codex, devin, and factory.

## install codex

install the private [estack plugin](https://chatgpt.com/plugins/plugins_6abd8639d7348191b31c1430745b5d94), or use the repo marketplace:

```sh
codex plugin marketplace add evan-mavis/skills --ref main
codex plugin add estack@evan-skills
```

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

## what's here

- [estack/](estack/) is the editable codex plugin, including shared workflows, my defaults, planning, and airgoods skills.
- [estack-devin/](estack-devin/) is the editable devin plugin.
- [estack-factory/](estack-factory/) is the editable factory plugin.
- [deprecated/](deprecated/) has archived workflows.

keep shared changes in sync across all three plugins according to [AGENTS.md](AGENTS.md). there are no generated packages, override layers, or shared symlinks.

```sh
bun scripts/check-estack.mjs
bun scripts/check-estack.mjs devin
bun scripts/check-estack.mjs factory
```

`scripts/install.sh` is the legacy shared-skill installer. it exposes codex skills through `.agents/skills`, which other tools can also discover. use native plugin installation for these variants. existing global links may need removal to avoid loading both versions.
