# Seller operations

Seller operations lets a brand complete onboarding, maintain its catalog, review orders, and move eligible order lines through fulfillment and shipping.

## Sub-features

- `seller-onboarding` covers Brand Information, Product Set Up, Payment Connection, Shipping Rates, and Request Launch.
- `seller-products` covers product listing, `/products/create`, editing, variants, images, inventory, imports, and collections.
- `seller-orders` covers order list, detail, status, products, totals, and fulfillment entry.
- `seller-fulfillment` covers manual tracking, local delivery, ShipStation, and in-platform label choices when configured.
- `seller-labels` covers shipping-label creation and label details without purchasing or voiding unless explicitly required.
- `seller-shipping` covers shipping profiles, rates, settings, and lead time.

## How to get to it (user POV)

- Sign in as a seller and visit `/account/seller/onboarding`.
- Visit `/account/seller/products`, choose `Create Product` to reach `/account/seller/products/create`, or open `/account/seller/products/<id>`.
- Visit `/account/seller/orders`, choose an order, then open `/account/seller/orders/<id>/shipping`.
- For eligible orders, open `/account/seller/orders/<id>/shipping_labels` or a label-details route.
- Visit `/account/seller/shipping` for shipping profiles and `/account/seller/settings/shipping` for shipping settings.

## Driving it

Preconditions:

- Full mode doctor passes and `Authenticated setup` selected a seller with a non-null supplier.
- Use `$query-local-db` to choose branch-local products and orders whose state matches the target path.
- Queue is healthy for asynchronous catalog/media and fulfillment work. Shipping-label purchase also requires configured test-safe carrier integration.

- **Onboarding.** Open `/account/seller/onboarding`. Require heading `Onboarding`, progress `N / 5 steps completed`, and `Brand Information`, `Product Set Up`, `Payment Connection`, `Shipping Rates`, and `Request Launch`. Verify one open/close or next-step transition. Do not connect payouts, change rates, mark admin completion, or request launch unless explicitly scoped.
- **Products.** Open `/account/seller/products`. Require heading `Products`, a row set or `No products found`, and `Create Product`. Create must reach `/account/seller/products/create`; an existing row must reach `/account/seller/products/<id>` with `Save` and `Active` or `Draft`. Save, import, image upload, and inventory edits only with branch-local cleanup.
- **Orders.** Open `/account/seller/orders`; exercise applicable `Pending`, `Accepted`, `Shipped`, `Cancelled`, or `Partially Fulfilled` filters. Open a row and require `/account/seller/orders/<id>` with matching order number, buyer, products, total, and status. UI `Accepted` corresponds to API `Confirmed`.
- **Fulfillment.** Open `/account/seller/orders/<id>/shipping`. Require `Fulfillment Items`, `Fulfillment Details`, selected lines, and state-appropriate actions such as `Fulfill locally`, `Create shipping label`, `Enter tracking information`, or `Print Labels`. Do not submit without a supported cleanup path.
- **Labels.** Open `/account/seller/orders/<id>/shipping_labels`; require `Create Shipping Label`, package details, and rates or an explicit no-rate/error state. A created label routes to label details with `Shipping Label Details`, print controls, and `Void Shipping Label`. `Buy Shipping Label` and void are external, billable mutations requiring explicit authorization.
- **Shipping.** Open `/account/seller/shipping`. Require heading `Shipping`, `Shipping Profiles`, and `Add Shipping Profile` or existing profiles. Saving a profile or settings is a mutation and must be restored.
- **Proof.** Record seller email, supplier ID, product/order ID, initial state, integration mode, and all mutations. For changed UI, show loading, populated or empty/error state, and compact/wide behavior where reachable.

## Gotchas

- Onboarding state is cumulative and can trigger launch review. Prefer read-only transitions unless onboarding itself is under test.
- Product save, image upload, integration import, inventory changes, fulfillment, label purchase, and label voiding all mutate branch-local or external state.
- Admin impersonation suppresses selected analytics; it does not prove seller tracking.
- Product import requires the queue worker. Label rate, purchase, and void use configured carrier services; the queue alone is insufficient.
- Fulfillment options depend on contracts, addresses, dimensions, weights, carrier configuration, and current order status. `onlyFulfilled=true` hides open-line fulfillment UI.
- Never record buyer addresses, payment details, carrier credentials, or labels containing personal data.
- A shipping-label quote is not proof that a label was purchased. Do not cross that boundary unless the task authorizes it.
