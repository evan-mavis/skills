---
name: design-critic
description: Review built screens against a taste file of Evan's design rules before he sees them, send failures back as a fix list, and turn repeated feedback into new rules. Use for design-critic, "critique this UI", a pass on built screens before their review, or turning repeated design feedback into rules.
---

# Design critic

Two jobs. Before Evan sees a screen, catch what his taste file already says. After he reacts, turn what he keeps saying into rules.

## Read the taste file

The rules live in [the taste file](assets/taste.md). Read it before every review. It starts empty on purpose: an empty file means no invented opinions.

Add a rule only from evidence. Never from your own preference, from a design article, or from a guess about what Evan would like.

## Review the built screens

Input is the built screens on the branch, plus the design-decisions section of the Linear spec.

1. List every screen, state, and viewport under review, and the decision each one implements.
2. Capture the screens the way [ui-review's capture guidance](../ui-review/references/capture-metadata.md) describes, so a later review round can compare against the same evidence.
3. Check each rule in the taste file against each screen. One row per rule and screen: pass, fail, or not applicable, with the evidence. Name the screen, the state, and exactly what you saw.
4. Check the screens against the recorded decisions. A screen that contradicts a recorded decision fails. A recorded decision with no matching screen is a gap.
5. Send the failures back to whoever owns the code as a fix list: one line per failure, the rule id, and the evidence. Do not hand Evan a screen that breaks a rule his file already records.
6. Hand the screens to the review round only when every check passes, or when you name the remaining failures and say why they are acceptable as they stand.

State which rules you checked and found nothing against. A review that only reports failures looks the same as one that never read the file.

## Classify Evan's feedback

After every review round, classify each piece of feedback once the fix list is in.

| class | what it looks like | what it does to the file |
| --- | --- | --- |
| one-off | a local fix, nothing implied about other screens | nothing |
| repeated | the same request in two or more rounds, or on two or more screens | a candidate rule |
| confirmed | Evan states a preference that outlives this screen | a candidate rule |
| question | asks for information | answered, no rule |

A candidate becomes a rule when two rounds agree on it, or when Evan states it as a general preference. Write the rule with three things:

- what it forbids or requires, in one sentence that a screenshot can settle;
- the feedback it came from, quoted, with the round and the date;
- the check that catches a violation, as an instruction the next reviewer can follow.

Never write a rule Evan did not say. Never write a rule about motion, timing, or behaviour that a still image cannot show. Never widen a rule past the words he used: "stop using all-caps labels on this screen" is not "stop using all-caps".

## Keep the file small

A rule that has never fired twice is noise, and a long file stops being read. Merge rules that describe one thing, and delete a rule Evan has since overruled. Keep his wording in the quote so the file stays checkable.

## Handoff

- **In:** the built screens on the branch, the design-decisions section of the Linear spec, and Evan's feedback from a review round.
- **Out:** a fix list for the code owner, a pass or fail verdict per rule with evidence, and taste-file rules that trace back to quoted feedback.
