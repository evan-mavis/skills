---
name: sharpen
description: "Rewrite a prompt with an expert approach and an independent check. Use for /estack-devin:sharpen."
triggers: [user]
---

Before rewriting the prompt, state:

1. What an expert would do that the user has not asked for.
2. Which raw sources they would start from.
3. Which specific methods and tools they would use.
4. What independent evidence would show the result is right.

Then return the rewritten prompt. Improve the approach without expanding the task. Preserve explicit constraints and leave product or preference choices with the user. Do not execute the task.
