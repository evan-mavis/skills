# Authentication entry

Anonymous visitors can open sign-in, choose retailer or seller account creation, reach password recovery, and hand off into the marketplace without altering another user's session.

## Sub-features

- `auth-sign-in-open` opens the sign-in form from public chrome.
- `auth-account-type` moves between sign-in and retailer/seller account selection.
- `auth-forgot-password-open` opens password recovery without submitting.
- `auth-handoff` verifies authenticated navigation into main web.
- `auth-dismiss` closes the dialog and restores the public page.

## How to get to it (user POV)

- Choose `Sign in` or `Sign up` in `Main navigation`.
- Follow create-account or forgot-password actions inside the dialog.
- Main-web deep link `/products?auth=sign-in` opens sign-in directly and may include `redirect=<path>`.

## Driving it

Preconditions:

- Public home is reachable and the browser context is anonymous.
- Full mode is required for authenticated or signup handoff into main web.

- **Open sign-in.** Choose `Sign in`; require `Welcome back!`, email `#airgoods-sign-in-email`, password `#airgoods-sign-in-password`, and submit `Sign in`.
- **Account choices.** Choose create account; require `Get started` and retailer/seller choices. Return to sign-in and require the same form.
- **Password recovery.** Choose forgot password and require the reset form. Do not enter or submit an email during routine verification.
- **Dismiss.** Press Escape; require the dialog to disappear and `Main navigation` to remain.
- **Authenticated handoff.** Follow `Authenticated setup` in `../SKILL.md`. Require the expected buyer/seller public chrome and main-web destination; invoke `/estack-devin:verify-airgoods-web` for destination behavior.
- **Proof.** Capture anonymous before state, selected dialog/handoff result, origin transition, and final route without credentials or tokens.

## Gotchas

- Never create an account, send a reset email, or clear a real user's auth state during routine verification.
- Public and main-web origins must agree on the handoff; direct public-only mode cannot prove it.
- Authenticated public chrome replaces `Sign in` and `Sign up`.
- `Get started` appears in multiple account-choice/signup contexts; assert surrounding controls.
- Admin impersonation proves UI routing, not analytics or normal password authentication.
