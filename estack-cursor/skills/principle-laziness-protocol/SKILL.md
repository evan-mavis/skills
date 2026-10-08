---
name: "principle-laziness-protocol"
description: "Apply when refactoring, evaluating diff size, or tempted to add abstractions, layers, or signal threading. Bias toward deletion and the smallest change that solves the problem."
---

# Laziness Protocol

Aim for the most result with the least code and complexity.

- **Prefer deletion.** When asked to refactor or improve, look for removals before additions.
- **Maintain a flat call hierarchy.** Avoid deep call chains. A rich interface that hides substantial work is not a deep call chain. If answering a question requires tracing through more than 3 files or layers, flatten it.
- **Consolidate decisions.** Do not repeat the same choice in several places. Put it behind one source of truth and pass the result as a simple flag.
- **Minimize the diff.** Make the smallest change that solves the problem. Fewer lines beat "elegant" boilerplate.
- **Resolve design conflicts.** Correctness and the required contract come first. If the existing design cannot satisfy them, apply [redesign from first principles](../principle-redesign-from-first-principles/SKILL.md), then choose the smallest complete implementation of that design. When replacing an internal API under [migrate callers](../principle-migrate-callers-then-delete-legacy-apis/SKILL.md), migrate all callers and delete the old path. A smaller diff that keeps incompatible behavior or duplicate API paths does not solve the problem.
- **Question the threading.** If a task asks you to pass a new signal through types, schemas, pipelines, or similar layers, stop and look for a more direct path.
- **Sweat the small leaks.** Remove tiny pass-throughs, representation leaks, and duplicated choices before they spread. Small leaks compound into permanent coordination costs.

**The test:** If a human developer would find the code exhausting to maintain, it is a bad solution.
