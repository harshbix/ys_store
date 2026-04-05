-- 011_add_guest_cart_rls_policies.sql
-- Add guest/anon RLS policies for session-token based cart access
-- This ensures backward compatibility with guest checkout flows

-- Guest cart access via session_token
drop policy if exists carts_guest_select on carts;
create policy carts_guest_select
  on carts
  for select
  to anon, authenticated
  using (
    (customer_auth_id is null and session_token is not null) OR
    (customer_auth_id is not null and customer_auth_id = auth.uid())
  );

drop policy if exists carts_guest_insert on carts;
create policy carts_guest_insert
  on carts
  for insert
  to anon, authenticated
  with check (
    (customer_auth_id is null and session_token is not null) OR
    (customer_auth_id is not null and customer_auth_id = auth.uid())
  );

drop policy if exists carts_guest_update on carts;
create policy carts_guest_update
  on carts
  for update
  to anon, authenticated
  using (
    (customer_auth_id is null and session_token is not null) OR
    (customer_auth_id is not null and customer_auth_id = auth.uid())
  )
  with check (
    (customer_auth_id is null and session_token is not null) OR
    (customer_auth_id is not null and customer_auth_id = auth.uid())
  );

-- Guest cart items access via parent cart session_token
drop policy if exists cart_items_guest_select on cart_items;
create policy cart_items_guest_select
  on cart_items
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from carts c
      where c.id = cart_items.cart_id
      and (
        (c.customer_auth_id is null and c.session_token is not null) OR
        (c.customer_auth_id is not null and c.customer_auth_id = auth.uid())
      )
    )
  );

drop policy if exists cart_items_guest_insert on cart_items;
create policy cart_items_guest_insert
  on cart_items
  for insert
  to anon, authenticated
  with check (
    exists (
      select 1
      from carts c
      where c.id = cart_items.cart_id
      and (
        (c.customer_auth_id is null and c.session_token is not null) OR
        (c.customer_auth_id is not null and c.customer_auth_id = auth.uid())
      )
    )
  );

drop policy if exists cart_items_guest_update on cart_items;
create policy cart_items_guest_update
  on cart_items
  for update
  to anon, authenticated
  using (
    exists (
      select 1
      from carts c
      where c.id = cart_items.cart_id
      and (
        (c.customer_auth_id is null and c.session_token is not null) OR
        (c.customer_auth_id is not null and c.customer_auth_id = auth.uid())
      )
    )
  )
  with check (
    exists (
      select 1
      from carts c
      where c.id = cart_items.cart_id
      and (
        (c.customer_auth_id is null and c.session_token is not null) OR
        (c.customer_auth_id is not null and c.customer_auth_id = auth.uid())
      )
    )
  );

drop policy if exists cart_items_guest_delete on cart_items;
create policy cart_items_guest_delete
  on cart_items
  for delete
  to anon, authenticated
  using (
    exists (
      select 1
      from carts c
      where c.id = cart_items.cart_id
      and (
        (c.customer_auth_id is null and c.session_token is not null) OR
        (c.customer_auth_id is not null and c.customer_auth_id = auth.uid())
      )
    )
  );
