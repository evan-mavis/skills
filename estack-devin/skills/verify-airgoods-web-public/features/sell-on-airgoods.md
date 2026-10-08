# Sell on Airgoods

The seller acquisition page explains the wholesale offering, shows retailer reach, and sends prospective brands into signup or the educational webinar.

## Sub-features

- `sell-render` shows the seller-specific hero and value proposition.
- `sell-retailer-map` renders retailer proof across the United States.
- `sell-signup-entry` opens the seller signup path.
- `sell-webinar-entry` exposes the webinar link.
- `sell-faq` exposes seller frequently asked questions.

## How to get to it (user POV)

- Choose `Sell on Airgoods` from `Main navigation`.
- Visit `/sell-on-airgoods` directly or through main-web proxy.
- Choose `Get started` for signup or `Join a live webinar`.

## Driving it

Preconditions:

- Public-only mode proves page content; full mode is required for main-web signup handoff.

- **Render.** Require heading `Sell wholesale to thousands of retailers.`.
- **Map proof.** Scroll to `Trusted by retailers nationwide`. Require image `Approved Airgoods retailers shown across a map of the United States` plus rendered map paths and retailer images.
- **Benefits and FAQ.** Require `Why Airgoods?` and `Frequently asked questions`.
- **Signup entry.** Choose the first hero `Get started` only in full mode. Require seller-signup navigation without submitting; invoke `/estack-devin:verify-airgoods-web` for destination behavior.
- **Webinar entry.** Confirm `Join a live webinar` has the expected external destination. Avoid leaving the evidence tab unless external navigation is in scope.
- **Proof.** Capture hero, map rendering, origin/mode, and selected handoff or link state.

## Gotchas

- Multiple `Get started` links exist; scope to the hero.
- Public-only mode cannot prove seller-signup destination.
- Visible map heading alone does not prove SVG paths and retailer images rendered.
- Webinar navigation may open another tab.
