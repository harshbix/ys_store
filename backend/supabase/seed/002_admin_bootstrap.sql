-- 002_admin_bootstrap.sql
-- This creates admin profile metadata only. The auth user must already exist in Supabase Auth.
-- Replace :ADMIN_EMAIL and :ADMIN_FULL_NAME before execution.
-- :ADMIN_AUTH_USER_ID is optional; if not provided, this script resolves it from auth.users using email.

do $$
declare
  v_admin_id uuid := nullif(':ADMIN_AUTH_USER_ID', ':ADMIN_AUTH_USER_ID')::uuid;
  v_admin_email text := nullif(':ADMIN_EMAIL', ':ADMIN_EMAIL');
  v_admin_full_name text := coalesce(nullif(':ADMIN_FULL_NAME', ':ADMIN_FULL_NAME'), 'Owner Admin');
begin
  if v_admin_id is null then
    if v_admin_email is null then
      select u.id, u.email into v_admin_id, v_admin_email
      from auth.users u
      order by u.created_at asc
      limit 1;

      if v_admin_id is not null then
        raise notice 'Using first auth user as admin bootstrap target: % (%).', v_admin_email, v_admin_id;
      end if;
    else
      select u.id into v_admin_id
      from auth.users u
      where u.email = v_admin_email
      limit 1;
    end if;

    if v_admin_id is null then
      raise exception 'No auth users found (or no auth.users record for email "%"). Create the auth user first.', coalesce(v_admin_email, '<none>');
    end if;
  end if;

  if v_admin_email is null then
    select u.email into v_admin_email
    from auth.users u
    where u.id = v_admin_id
    limit 1;
  end if;

  if v_admin_email is null then
    raise exception 'Could not resolve admin email for auth user id %', v_admin_id;
  end if;

  insert into admin_users (id, email, full_name, role, is_active)
  values (v_admin_id, v_admin_email, v_admin_full_name, 'owner', true)
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    is_active = excluded.is_active,
    updated_at = now();
end $$;
