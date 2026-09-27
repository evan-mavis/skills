# Airgoods schema examples

These names and columns were observed in the `evanmavis-local-dev` development branch in September 2026. They are **examples for finding data**, not a schema guarantee. Inspect the active database's `information_schema` before relying on them.

| Example table | Useful columns | Relationship |
| --- | --- | --- |
| `public.product` | `id`, `uuid`, `name`, `status`, `supplier_id` | `supplier_id` joins `supplier.id` |
| `public.supplier` | `id`, `name`, `status` | Parent brand for products and shipping profiles |
| `public.shipping_profile` | `id`, `supplier_id`, `shipping_price_type`, `states`, `store_types`, `from_airgoods`, `is_deleted` | `supplier_id` joins `supplier.id` |
| `public.shipping_profile_rate_tier` | `id`, `shipping_profile_id`, `shipping_price_type`, `min_order_subtotal_cents` | `shipping_profile_id` joins `shipping_profile.id` |
| `public.shipping_profile_product` | `product_id`, `shippping_profile_id` | Restricts a profile to linked products when populated; the column has three `p`s in `shippping` |

Example: find a few active products and their brands:

```sql
select p.id, p.uuid, p.name, s.name as supplier
from public.product p
join public.supplier s on s.id = p.supplier_id
where p.status::text = 'active'
order by p.id
limit 20;
```

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
