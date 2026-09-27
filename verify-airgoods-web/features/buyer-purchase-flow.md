# Buyer purchase flow

The buyer purchase flow opens a live product, adds a sellable variant to the cart, satisfies brand minimums, and reaches checkout with the expected quantity and landed pricing.

## Sub-features

- `purchase-product` opens a live product detail page from marketplace results.
- `purchase-add` adds an in-stock variant and updates the cart.
- `purchase-cart` shows the selected line, quantity, and brand-minimum state.
- `purchase-checkout` reaches checkout with shipping and payment choices.
- `purchase-order` places an order only when the task explicitly authorizes that side effect.

## How to get to it (user POV)

- Open `/products`, then choose a visible product result.
- Choose `Add to cart` on `/product/<id-slug>`.
- Choose the control named `Open cart`, then a button whose name starts with `Checkout`.
- Continue from `/cart` to `/cart/checkout`.

## Driving it

Preconditions:

- Full mode doctor passes and the isolated Neon branch contains a live, in-stock product.
- Follow `Authenticated setup` in `../SKILL.md`: use `$query-local-db` to select an eligible buyer, fall back to the confirmed `sara@butterfieldmarket.com` row, and use local admin impersonation rather than the user's real credentials.
- Record the initial cart so cleanup can restore it.

- **Open product.** From `/products`, choose a visible product result. Require `/product/<id-slug>` and a heading matching the chosen product.
- **Add.** Select an in-stock variant when required and choose `Add to cart`. Require the button to report `Added!` or the `Open cart` control to reflect the line.
- **Inspect cart.** Open `/cart`. Require the selected product, a control named `Quantity in units`, and the applicable brand-minimum state.
- **Reach checkout.** Satisfy the minimum with the smallest reversible quantity change, choose the button matching `Checkout`, and require `/cart/checkout` with the selected line and totals preserved.
- **Place order only when authorized.** Require explicit task scope, a dedicated test buyer, test-safe payment/shipping, and a cleanup or cancellation path before choosing `Place Order`. Prove `/cart/checkout/confirmation` and the created order through a second read.
- **Proof.** Capture the product before adding and the cart or checkout after adding. Record product ID, quantity, cart totals, account fixture, and every mutation in `run.txt`.

## Gotchas

- This feature is unreachable in public-only mode or without buyer credentials.
- Admin impersonation can suppress selected analytics and side effects; it proves the buyer UI and branch-local cart state, not those suppressed behaviors.
- Never hardcode a product UUID. Choose a visible, in-stock result from the current isolated database.
- Guest `Add to cart` may open an email or authentication path instead of writing a buyer cart.
- Brand minimums can block checkout; record the displayed minimum rather than guessing.
- Plaid, Evervault, or external payment state can make order placement unsafe. Stop at checkout unless the task explicitly requires and safely supports a real submit.
- Restore the original cart during cleanup. Order creation needs its own documented cancellation or cleanup evidence.
