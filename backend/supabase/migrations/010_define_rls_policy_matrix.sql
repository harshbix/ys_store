-- 010_define_rls_policy_matrix.sql
-- Explicit RLS policy matrix for defense-in-depth.
-- Backend service-role remains primary trusted access path.

-- Public storefront reads: products and related details only when visible.
drop policy if exists products_public_read_visible on products;
create policy products_public_read_visible
  on products
  for select
  to anon, authenticated
  using (is_visible = true);

drop policy if exists product_specs_public_read_visible_product on product_specs;
create policy product_specs_public_read_visible_product
  on product_specs
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from products p
      where p.id = product_specs.product_id
        and p.is_visible = true
    )
  );

drop policy if exists product_media_public_read_visible_product on product_media;
create policy product_media_public_read_visible_product
  on product_media
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from products p
      where p.id = product_media.product_id
        and p.is_visible = true
    )
  );

drop policy if exists shop_media_public_read_visible on shop_media;
create policy shop_media_public_read_visible
  on shop_media
  for select
  to anon, authenticated
  using (is_visible = true);

-- Authenticated customer ownership: wishlists.
drop policy if exists wishlists_owner_select on wishlists;
create policy wishlists_owner_select
  on wishlists
  for select
  to authenticated
  using (customer_auth_id = auth.uid());

drop policy if exists wishlists_owner_insert on wishlists;
create policy wishlists_owner_insert
  on wishlists
  for insert
  to authenticated
  with check (customer_auth_id = auth.uid());

drop policy if exists wishlists_owner_update on wishlists;
create policy wishlists_owner_update
  on wishlists
  for update
  to authenticated
  using (customer_auth_id = auth.uid())
  with check (customer_auth_id = auth.uid());

drop policy if exists wishlists_owner_delete on wishlists;
create policy wishlists_owner_delete
  on wishlists
  for delete
  to authenticated
  using (customer_auth_id = auth.uid());

-- Authenticated customer ownership: wishlist items through parent wishlist.
drop policy if exists wishlist_items_owner_select on wishlist_items;
create policy wishlist_items_owner_select
  on wishlist_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from wishlists w
      where w.id = wishlist_items.wishlist_id
        and w.customer_auth_id = auth.uid()
    )
  );

drop policy if exists wishlist_items_owner_insert on wishlist_items;
create policy wishlist_items_owner_insert
  on wishlist_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from wishlists w
      where w.id = wishlist_items.wishlist_id
        and w.customer_auth_id = auth.uid()
    )
  );

drop policy if exists wishlist_items_owner_delete on wishlist_items;
create policy wishlist_items_owner_delete
  on wishlist_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from wishlists w
      where w.id = wishlist_items.wishlist_id
        and w.customer_auth_id = auth.uid()
    )
  );

-- Authenticated customer ownership: carts and cart items.
drop policy if exists carts_owner_select on carts;
create policy carts_owner_select
  on carts
  for select
  to authenticated
  using (customer_auth_id = auth.uid());

drop policy if exists carts_owner_insert on carts;
create policy carts_owner_insert
  on carts
  for insert
  to authenticated
  with check (customer_auth_id = auth.uid());

drop policy if exists carts_owner_update on carts;
create policy carts_owner_update
  on carts
  for update
  to authenticated
  using (customer_auth_id = auth.uid())
  with check (customer_auth_id = auth.uid());

drop policy if exists carts_owner_delete on carts;
create policy carts_owner_delete
  on carts
  for delete
  to authenticated
  using (customer_auth_id = auth.uid());

drop policy if exists cart_items_owner_select on cart_items;
create policy cart_items_owner_select
  on cart_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from carts c
      where c.id = cart_items.cart_id
        and c.customer_auth_id = auth.uid()
    )
  );

drop policy if exists cart_items_owner_insert on cart_items;
create policy cart_items_owner_insert
  on cart_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from carts c
      where c.id = cart_items.cart_id
        and c.customer_auth_id = auth.uid()
    )
  );

drop policy if exists cart_items_owner_update on cart_items;
create policy cart_items_owner_update
  on cart_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from carts c
      where c.id = cart_items.cart_id
        and c.customer_auth_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from carts c
      where c.id = cart_items.cart_id
        and c.customer_auth_id = auth.uid()
    )
  );

drop policy if exists cart_items_owner_delete on cart_items;
create policy cart_items_owner_delete
  on cart_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from carts c
      where c.id = cart_items.cart_id
        and c.customer_auth_id = auth.uid()
    )
  );

-- Authenticated customer ownership: custom builds and build items.
drop policy if exists custom_builds_owner_select on custom_builds;
create policy custom_builds_owner_select
  on custom_builds
  for select
  to authenticated
  using (customer_auth_id = auth.uid());

drop policy if exists custom_builds_owner_insert on custom_builds;
create policy custom_builds_owner_insert
  on custom_builds
  for insert
  to authenticated
  with check (customer_auth_id = auth.uid());

drop policy if exists custom_builds_owner_update on custom_builds;
create policy custom_builds_owner_update
  on custom_builds
  for update
  to authenticated
  using (customer_auth_id = auth.uid())
  with check (customer_auth_id = auth.uid());

drop policy if exists custom_builds_owner_delete on custom_builds;
create policy custom_builds_owner_delete
  on custom_builds
  for delete
  to authenticated
  using (customer_auth_id = auth.uid());

drop policy if exists custom_build_items_owner_select on custom_build_items;
create policy custom_build_items_owner_select
  on custom_build_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from custom_builds b
      where b.id = custom_build_items.custom_build_id
        and b.customer_auth_id = auth.uid()
    )
  );

drop policy if exists custom_build_items_owner_insert on custom_build_items;
create policy custom_build_items_owner_insert
  on custom_build_items
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from custom_builds b
      where b.id = custom_build_items.custom_build_id
        and b.customer_auth_id = auth.uid()
    )
  );

drop policy if exists custom_build_items_owner_update on custom_build_items;
create policy custom_build_items_owner_update
  on custom_build_items
  for update
  to authenticated
  using (
    exists (
      select 1
      from custom_builds b
      where b.id = custom_build_items.custom_build_id
        and b.customer_auth_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from custom_builds b
      where b.id = custom_build_items.custom_build_id
        and b.customer_auth_id = auth.uid()
    )
  );

drop policy if exists custom_build_items_owner_delete on custom_build_items;
create policy custom_build_items_owner_delete
  on custom_build_items
  for delete
  to authenticated
  using (
    exists (
      select 1
      from custom_builds b
      where b.id = custom_build_items.custom_build_id
        and b.customer_auth_id = auth.uid()
    )
  );

-- Intentionally no broad client policies for quotes, quote_items, analytics_events, admin_users.
-- Those paths remain backend-controlled in compatibility mode.