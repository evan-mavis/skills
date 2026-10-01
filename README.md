# skills

these are the skills i use to get work done with agents :)

built on lauren tan's [pstack](https://github.com/cursor/plugins/tree/main/pstack), with my personal defaults and airgoods workflows. [estack](estack/) brings them together for codex.

## install

install the private [estack plugin](https://chatgpt.com/plugins/plugins_6abd8639d7348191b31c1430745b5d94), or use the repo marketplace:

```sh
codex plugin marketplace add evan-mavis/skills --ref main
codex plugin add estack@evan-skills
```

## what's here

- [estack/](estack/) is the editable codex plugin, including shared workflows, my defaults, planning, and airgoods skills.
- [deprecated/](deprecated/) has archived workflows.

for local skill installation, run `./scripts/install.sh`. replaced files are backed up to `~/.skills-backup/`; `--check` reports drift.
