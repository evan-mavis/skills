# Shared Airgoods schema reference

Core tables, columns, foreign keys, and enum labels below were inspected live through Render's read-only tool on October 1, 2026, in production `stack_anry`. These observations are not a schema guarantee for Neon development branches. Development copies can lag production and diverge after branching. Discover undocumented fields and confirm these columns in the selected environment before use.

| Table | Useful columns | Verified joins |
| --- | --- | --- |
| `public."user"` | `id`, `email`, `store_id`, `supplier_id`, `is_deleted`, `created_at` | `store_id → store.id`; `supplier_id → supplier.id` |
| `public.store` | `id`, `name`, `status`, `user_id`, `created_at` | Buyer business; join users through `"user".store_id` |
| `public.supplier` | `id`, `name`, `status`, `user_id`, `created_at` | Supplier business; join users through `"user".supplier_id` |
| `public.product` | `id`, `name`, `status`, `deleted`, `supplier_id`, `created_at` | `supplier_id → supplier.id` |
| `public.order_master` | `id`, `status`, `store_id`, `user_id`, `supplier_id`, `created_at` | Foreign keys to `store.id`, `"user".id`, and `supplier.id` |
| `public.order_detail` | `id`, `order_id`, `product_id`, `qty`, `price`, `total`, `created_at` | Order line; `order_id → order_master.id`; `product_id → product.id` |

`store.user_id` and `supplier.user_id` exist, but the inspected schema did not declare foreign keys for them. Do not assume they enumerate all business users.

## Filters and status values

- Non-deleted users use `"user".is_deleted = false`.
- Active products use `product.status::text = 'active' AND product.deleted = false`. Product statuses are `active` and `draft`.
- Supplier statuses are `signed_up`, `onboarding`, `live`, `on_pause`, `churned`, `waitlist`, `declined`, and `test`. Use `live` when the task asks for live suppliers.
- Store statuses are `live`, `overdue`, `test`, `limit`, and `pending`. These are business states. `live` alone is not a universal buyer filter.
- Order statuses are `Pending`, `Cancelled`, `Cancellation Pending`, `Confirmed`, `Partially Fulfilled`, `Shipped`, `Delivered`, and `On Hold`. Match their exact case.
- No `deleted` or `is_deleted` field was found on `store`, `supplier`, `order_master`, or `order_detail`. Do not invent a deletion filter. Preserve historical order items even when their products are now deleted.

## Bounded read-only examples

Use synthetic placeholders below. Substitute only identifiers needed for the authorized lookup.

Buyer by email:

```sql
SELECT id, email, store_id, created_at
FROM public."user"
WHERE lower(email) = lower('buyer@example.com')
  AND store_id IS NOT NULL AND is_deleted = false
ORDER BY id LIMIT 10;
```

Buyer's store:

```sql
SELECT s.id, s.name, s.status
FROM public."user" u
JOIN public.store s ON s.id = u.store_id
WHERE lower(u.email) = lower('buyer@example.com') AND u.is_deleted = false
ORDER BY s.id LIMIT 10;
```

Supplier by name:

```sql
SELECT id, name, status
FROM public.supplier
WHERE lower(name) = lower('Example Supplier')
ORDER BY id LIMIT 20;
```

Recent orders for a verified store ID:

```sql
SELECT id, created_at, status, supplier_id, user_id
FROM public.order_master
WHERE store_id = 123
ORDER BY created_at DESC, id DESC LIMIT 20;
```

Order items for a verified order ID:

```sql
SELECT d.id, d.product_id, p.name, d.qty, d.price, d.total
FROM public.order_detail d
JOIN public.order_master o ON o.id = d.order_id
LEFT JOIN public.product p ON p.id = d.product_id
WHERE o.id = 456
ORDER BY d.id LIMIT 100;
```

## Development shipping examples

The following shipping columns were observed in `evanmavis-local-dev` in September 2026. They have not been verified here against production. Inspect the selected branch before relying on them.

| Example table | Useful columns | Relationship |
| --- | --- | --- |
| `public.shipping_profile` | `id`, `supplier_id`, `shipping_price_type`, `states`, `store_types`, `from_airgoods`, `is_deleted` | `supplier_id` joins `supplier.id` |
| `public.shipping_profile_rate_tier` | `id`, `shipping_profile_id`, `shipping_price_type`, `min_order_subtotal_cents` | `shipping_profile_id` joins `shipping_profile.id` |
| `public.shipping_profile_product` | `product_id`, `shippping_profile_id` | Restricts a profile to linked products when populated; the column has three `p`s in `shippping` |


Example: inspect a brand’s shipping profiles and tiers:

```sql
select sp.id, sp.shipping_price_type, sp.states, sp.store_types,
       sp.from_airgoods, t.min_order_subtotal_cents,
       t.shipping_price_type as tier_type
from public.shipping_profile sp
left join public.shipping_profile_rate_tier t on t.shipping_profile_id = sp.id
where sp.supplier_id = 123 and sp.is_deleted = false
order by sp.id, t.min_order_subtotal_cents
limit 50;
```

These rows alone do not prove the shipping rate a buyer sees. Profile selection also depends on destination, store and relationship eligibility, linked products, the basket, and buyer-facing Airgoods rates. For UI claims such as “Added after shipped,” verify the selected buyer-facing quote rather than labeling a product from a seller profile alone.
