# Buyer post-purchase

Buyer post-purchase lets a retailer browse past orders, inspect deliveries and tracking, file a damage claim, and rebuild a cart from a prior order.

## Sub-features

- `post-orders` loads `/account/buyer/orders` and opens `/account/buyer/orders/<id>`.
- `post-deliveries` loads `/account/buyer/deliveries` in list or calendar view and opens the delivery details panel.
- `post-tracking` opens `/account/buyer/orders/<id>/track` for an order with tracking.
- `post-damage` opens `/account/buyer/orders/<id>/damage-report` and an existing claim view without submitting unless authorized.
- `post-reorder` uses order-detail `Buy Again` or `/home/order?tab=reorder` to rebuild a cart.

## How to get to it (user POV)

- In buyer account navigation, choose `Orders` or `Deliveries`.
- From the orders table, open a row or choose `Message`, `Invoice`, `Report`, or a tracking action.
- On order detail, use `Buy Again`, `Report an Issue`, `Invoice`, or `More Actions`.
- For the reorder workspace, open `/home/order` and choose `Reorder`, which resolves to `?tab=reorder`.

## Driving it

Preconditions:

- Full mode doctor passes. Follow `Authenticated setup` in `../SKILL.md` for an eligible buyer.
- Use `/query-local-db` to select the smallest matching order: shipping labels for tracking; shipped, delivered, or partially fulfilled with no parent order for damage reporting; delivered history for reorder.
- Record the starting cart and order status before any mutation. Queue must be healthy for tracking refreshes and asynchronous follow-up.

- **Orders list.** Open `/account/buyer/orders`. Require heading `Orders`. Accept only a settled row set, `No results found`, or an explicit error after loading. Exercise applicable status filters and order type filters, then open a row and require `/account/buyer/orders/<id>`.
- **Order detail.** Require the matching order number, normalized status, products, placed date, and total. Check visible actions such as `Buy Again`, `Report an Issue`, `Invoice`, `Pay Now`, or `Edit`. Menu `More Actions` may contain `Track Order`, `Mark as Delivered`, `Report an Issue`, and `Buy Again` according to order state.
- **Deliveries.** Open `/account/buyer/deliveries` and require heading `Deliveries`. Toggle `Show List` and `Show Calendar`; verify populated cards or explicit empty copy such as `Your deliveries will show up here` or `No deliveries match your filters`. Choose `View delivery details` and require `Delivery details panel`. Do not choose `Mark Delivered`, `Refresh Tracking`, or `Archive` unless scoped.
- **Tracking.** Choose `Track Order` or open `/account/buyer/orders/<id>/track`. Require the matching carrier/package timeline or explicit `No tracking information available` state. Do not refresh carrier data unless that mutation is under test.
- **Damage report.** Choose `Report` or `Report an Issue`. Verify `Select Products`, `Describe the Issue`, and `Review & Submit`, including required product, issue, quantity, details, and photo validation. Do not choose `Submit Report` without explicit authorization and a supported `Cancel Report` cleanup path.
- **Reorder.** On detail, `Buy Again` must update the cart and show `Products added to cart!`. In `/home/order?tab=reorder`, require tab `Reorder`, region `Reorder collections`, search `Search reorder collections`, and a past-order `Add to Cart` or `Add again` action. Record partial add/skip messaging and restore the cart.
- **Proof.** Record buyer email, database source, order ID/number, route, starting status, and exact before/after cart or claim state. Prefer read-only paths; capture compact and wide layouts when they changed.

## Gotchas

- This feature is unreachable in public-only mode or without buyer authentication.
- Each action is state-gated. Never hardcode an order ID; discover a matching branch-local fixture.
- Table and detail damage-report actions require eligible shipped, delivered, or partially fulfilled orders and exclude parent split orders.
- `Mark Delivered`, `Archive`, `Refresh Tracking`, damage submission, and reorder mutate data or contact carriers.
- Admin impersonation skips account analytics on these pages and can alter protected side effects. It proves permitted UI and branch-local data, not analytics.
- Tracking links leave Airgoods. Do not expose addresses, customer details, or claim photos in video.
- Reorder can partially succeed. Prove both feedback and final cart, then restore the starting cart.
