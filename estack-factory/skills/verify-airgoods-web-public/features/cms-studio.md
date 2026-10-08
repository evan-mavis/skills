# CMS Studio

CMS Studio lets authorized editors unlock the embedded Sanity workspace, preview drafts, and publish retailer or seller features and changelog entries.

## Sub-features

- `studio-gate` covers configured, rejected, rate-limited, and unconfigured password states.
- `studio-shell` covers embedded Sanity and its second authentication boundary.
- `studio-draft-preview` covers enabling and exiting preview.
- `studio-authoring` covers document create/edit/publish/delete boundaries.
- `studio-revalidation` covers signed publish webhook behavior when explicitly scoped.

## How to get to it (user POV)

- Open `/blog/studio`.
- Unlock through `Studio Access`, then authenticate with Sanity when required.
- Use Blog Settings or retailer/seller Features and Changelog desks.
- Use Presentation for draft preview and `Exit Preview` for published mode.

## Driving it

Preconditions:

- Web-public is healthy. Studio needs configured Sanity project/dataset and Studio password; draft preview needs read/browser tokens.
- Record environment/dataset labels only. Treat active Sanity as shared external state unless disposable scope is confirmed.

- **Gate.** Require `Studio Access`, `Password`, and `Unlock Studio`; missing configuration must show its explicit error.
- **Rejected login.** One wrong value may verify `invalid-password`; do not approach rate limit or record the value.
- **Unlock.** Enter the configured password before recording. Require Studio shell or separate Sanity login. MFA or inaccessible embedded UI is a valid blocker.
- **Draft preview.** Require draft content or explicit unavailable state, then choose `Exit Preview` and require published mode.
- **Authoring.** Inspect Blog Settings and audience Features/Changelog lists. Do not create, edit, publish, unpublish, or delete on shared data during routine verification.
- **Publish/revalidation.** Only with explicit authorization and a disposable document, publish one uniquely named item, prove its public route/index/sitemap, then remove or restore it. Do not call revalidation directly as a substitute.
- **Proof.** Capture gate before credentials, Studio chrome after unlock, dataset label, document type, draft/published state, and public read. Start video after authentication.

## Gotchas

- Airgoods Studio password and Sanity account authentication are separate.
- Marketplace admin impersonation does not unlock Studio.
- Repeated failures can trigger lockout.
- Studio may expose weak accessibility handles; never click guessed coordinates.
- Publish/delete and draft mode mutate CMS/session state.
- Studio is intentionally noindex.
- Never capture drafts, credentials, author data, webhook payloads, or unpublished assets.
