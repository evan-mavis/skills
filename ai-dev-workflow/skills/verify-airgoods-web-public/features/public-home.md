# Public home

The public home page explains Airgoods to retailers and brands and gives anonymous visitors working paths into authentication, marketplace search, and customer proof.

## Sub-features

- `home-render` shows the public header and landing content without failed page assets.
- `home-sign-in` opens and dismisses the sign-in dialog.
- `home-sign-up` opens and dismisses the retailer sign-up dialog.
- `home-stories` advances the customer-stories rail.
- `home-search` submits a marketplace search from the public header.

## How to get to it (user POV)

- Visit `/` through the main web proxy in full mode.
- Visit `/` directly on web-public in public-only mode.
- Use `Main navigation` for search, sign-in, sign-up, and seller entry.

## Driving it

Preconditions:

- The doctor reports full mode or a healthy public-only server.
- The verification tab is anonymous.

- **Render.** Navigate to `/`. Require navigation `Main navigation` and heading `The modern distributor`.
- **Open sign-in.** In `Main navigation`, choose `Sign in`. Require a dialog, then press Escape and require it to disappear.
- **Open sign-up.** Choose `Sign up`. Require heading `Get started`, capture proof, then press Escape.
- **Advance a story.** Scroll region `Customer stories` into view and choose `Next customer story`. Require the active story content or rail position to change.
- **Search entry.** Fill `Search Airgoods`, choose `Search`, and require navigation to main-web marketplace with the query preserved. Run this only in full mode and invoke `$verify-airgoods-web` for the destination.
- **Proof.** Record feature ID, origin, mode, viewport, exact action, and result. The screenshot must include public identity and the acted-on state.

## Gotchas

- Main web redirects or proxies anonymous `/` to web-public; direct web-public is not proof of proxy behavior.
- A stale authenticated session can redirect away from `/`. Do not clear a user's shared auth state.
- Desktop and compact controls switch at 769 px.
- Customer stories is below the fold.
- Public-only mode cannot prove marketplace search or authenticated handoff.
