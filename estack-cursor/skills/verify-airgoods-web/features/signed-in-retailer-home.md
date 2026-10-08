# Signed-in retailer home

Retailer home gives an authenticated buyer four task-focused entry points: Discover products, Order from a dense catalog and cart workspace, Grow through retailer programs, and ask Olive for assisted work.

## Sub-features

- `home-resolve` sends an eligible signed-in buyer from `/home` to the correct default tab.
- `home-discover` opens `/home/discover` and shows personalized discovery content.
- `home-order` opens `/home/order` with searchable products and the cart workspace.
- `home-grow` opens `/home/grow` with placement and demo summaries.
- `home-olive` opens `/olive` or `/olive/c/<uuid>` with conversation history and the `Ask Olive` composer.
- `home-default` opens `Default Home Tab`, changes the saved default, and restores it when that mutation is in scope.

## How to get to it (user POV)

- Sign in as an eligible buyer and choose Home.
- Visit `/home`; the account's default tab resolves automatically.
- Use navigation named `Home tabs` and choose `Discover`, `Order`, `Grow`, or `Olive`.
- On compact layouts, use `Switch Home tab. Current tab: <label>`.
- Use `Help & homepage` for `Tour the new homepage` and `Set default homepage tab`.

## Driving it

Preconditions:

- Full mode doctor passes. Olive and asynchronous actions also require a healthy queue worker.
- Follow `Authenticated setup` in `../SKILL.md` for a buyer with a non-null store.
- `new-retailer-homepage` must resolve to `new-ux` for Discover, Order, and Grow. Admin impersonation forces that treatment; use a normally assigned treatment buyer when testing flag evaluation itself.
- Grow needs at least one retailer placements/demos flag. `olive-retailer-agent-disabled` must not disable Olive for the selected buyer.

- **Resolve home.** Navigate to `/home`. Require a stable destination under `/home/discover`, `/home/order`, `/home/grow`, or `/olive`; a redirect to marketing or seller pages fails.
- **Discover.** Choose `Discover` from `Home tabs`. Require `/home/discover` and discovery content after pagination skeletons, or a concrete empty, rate-limited, or error state.
- **Order.** Choose `Order`. Require `/home/order`, tabs `All Products` and `Reorder`, searchbox `Search products`, region `Cart`, and table `Cart products`. At wide width require separator `Resize Products and Cart panes`; at compact width verify the single-pane/cart-toggle behavior. Add no item unless the task requires a reversible cart mutation.
- **Grow.** Choose `Grow`. Require `/home/grow` and the enabled tabs among `Calendar`, `Requests`, `Placement Setup`, and `Demo Setup`. Accept `Loading Grow…` only as transitional; verify the resulting region, explicit empty state, or alert. Exercise nested placement/demo routes only with matching local data.
- **Olive.** Choose `Olive`. Require `/olive`, region `Olive assistant`, region `Messages`, and form `Ask Olive`, or the explicit unavailable message. A prompt creates conversation state; send one only when model behavior is in scope, the queue is healthy, and the exact prompt/response are safe to record.
- **Default tab.** Through `Help & homepage`, choose `Set default homepage tab`. Require radiogroup `Default Home Tab` and radios named for available modes. Saving must show `<Mode> is now your default Home tab.` and the prior default must be restored.
- **Responsive and state proof.** At wide and compact widths, capture the active tab, route, loading-to-result transition, and any reachable empty/error state. For a changed tab, complete one interaction cycle rather than proving only initial render.

## Gotchas

- Control accounts or unavailable flags can redirect nested treatment routes to legacy account pages. Record the resolved variant and route rather than forcing navigation.
- `/olive` is a fullscreen route, not `/home/olive`.
- Grow can redirect to Discover when the selected buyer lacks both placements and demos availability.
- Admin impersonation forces the treatment, skips automatic tour opening, and suppresses selected analytics. It proves routing and UI behavior, not experiment assignment or analytics delivery.
- Order cart changes are branch-local but persistent. Snapshot and restore the starting cart.
- Default-tab saves and Olive messages are persistent branch-local mutations. Avoid or restore them.
- Never claim compact or wide behavior from source inspection; record both rendered viewports when layout is in scope.
