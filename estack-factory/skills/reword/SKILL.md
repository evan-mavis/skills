---
name: "reword"
description: "rewrite text in evan's voice. use for /reword or requests to make writing clearer, warmer, more natural, concise, and lowercase."
---

# reword

rewrite the supplied text. if none is supplied, rewrite the previous assistant response.

keep the meaning, facts, uncertainty, and intended audience. do not add claims, commitments, or explanations that were not there.

## voice

- write prose in lowercase, including headings, names, and acronyms.
- lead with the point. explain what happened, why it matters, and the next step when relevant.
- use plain words, contractions, and short, complete sentences. fix typos and tangled sentences without making the text abrupt or cold.
- sound warm, friendly, and approachable. keep natural acknowledgments, appreciation, and offers to help when they fit.
- use casual phrases like "sounds good", "for sure", and "lmk" when they feel natural. do not force slang or imitate mistakes.
- keep enthusiasm proportional to the message. an occasional exclamation mark is fine. avoid corporate language and forced enthusiasm.
- use short paragraphs. add bullets or headings only when they make the text easier to read.
- remove filler, repetition, jargon, and unnecessary caveats. preserve qualifications that affect the meaning.
- preserve exact code, commands, paths, urls, identifiers, and quoted interface labels when changing their case would alter their meaning.

follow [unslop](../unslop/SKILL.md). use the [pstack readme](https://github.com/cursor/plugins/blob/main/pstack/README.md) as a reference for language and formatting, not facts.

return only the rewritten text unless the user asks for alternatives or an explanation. this skill drafts text; it does not send or publish it.

## examples

these are illustrative rewrites, not templates. vary the wording naturally and preserve only facts and commitments supported by the original.

### acknowledge and follow through

before: "i will review the changes and provide feedback once my review is complete."

after: "sounds good! i'll take a look and send over any feedback."

### explain a problem and the fix

before: "the issue occurs because processing begins before the upload has completed. i am implementing a change to address this."

after: "this happens because processing starts before the upload finishes. i'm updating it to wait until the files are ready."

### share progress

before: "the requested changes have been completed. validation is currently in progress, and i will notify you upon completion."

after: "made the changes! testing them now and will ping you when they're ready."

### ask for a check

before: "please confirm whether the proposed approach is acceptable before i proceed."

after: "does this approach look good to you? want to check before moving forward."

### offer help

before: "please do not hesitate to contact me should you require further assistance."

after: "lmk if you have any questions! happy to help."

### keep an important caveat

before: "the fix appears to be successful in testing, although we have not yet verified it in production."

after: "looks good in testing! still need to check it in prod before calling it fixed."

### write documentation

before: "this tool enables users to transform existing content into a more accessible and personalized communication style."

after: "use /reword to make text clearer and sound more like you."
