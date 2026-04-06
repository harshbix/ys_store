# Hosted Product Seed Checklist (Phase 1 Blocker Unblock)

Date: 2026-04-06  
Scope: Hosted Supabase seeding required to unblock Product Flow runtime verification.

## Preconditions

1. Use Supabase Dashboard for the correct hosted project.
2. Open SQL Editor and run one file at a time, in the exact order below.
3. Do not continue to Product Flow runtime verification until final visible count check passes.

## Success Criteria Precision Rules

- Step 1 count is exact and must equal `16`.
- Step 3 seeded counts are exact and must equal `8` products, `20` specs, `8` media.
- Final hosted visible-products gate is non-exact and must be greater than `0`.
- Any mismatch against exact criteria is a hard stop.

## Seed File Order (Exact)

1. `backend/supabase/seed/001_spec_definitions.sql`
2. `backend/supabase/seed/002_admin_bootstrap.sql`
3. `backend/supabase/seed/003_demo_products.sql`

## Step 1: Run 001_spec_definitions.sql

What this seeds:
- Base `spec_definitions` keys used by product specs/filtering/comparison.

Expected row count after step:
- `spec_definitions` for seeded keys: exactly `16`.

Verification query (run immediately after step 1):

WARNING:
Paste only the SQL body into Supabase SQL Editor.
Do NOT paste markdown fences such as \`\`\`sql, sql, or \`\`\`.

```sql
select count(*) as seeded_spec_definition_count
from spec_definitions
where spec_key in (
  'cpu_model','cpu_socket','gpu_model','ram_gb','ram_type','storage_gb','storage_type',
  'screen_size_in','refresh_rate_hz','motherboard_socket','motherboard_ram_type',
  'motherboard_max_ram_gb','gpu_length_mm','case_max_gpu_length_mm','psu_wattage',
  'estimated_system_wattage'
);
```

Expected result:
- `seeded_spec_definition_count = 16`

If this is not exactly `16`:
- STOP.
- Do not continue to Step 2.
- Investigate missing/duplicate spec keys before proceeding.

## Pre-check: Auth Users Presence

Run this before Step 2:

WARNING:
Paste only the SQL body into Supabase SQL Editor.
Do NOT paste markdown fences such as \`\`\`sql, sql, or \`\`\`.

```sql
select count(*) as auth_user_count
from auth.users;
```

Expected result:
- `auth_user_count > 0`

If result is `0`:
- STOP.
- Do NOT run `002_admin_bootstrap.sql`.
- Create at least one user via Supabase Auth before continuing.

## Step 2: Run 002_admin_bootstrap.sql

What this seeds:
- One upsert into `admin_users` for the resolved admin auth user.

Notes:
- If placeholders are unchanged, script attempts to use first `auth.users` record.
- If there are no `auth.users` records, this step will fail by design.

Expected row count after step:
- For resolved admin user id: exactly `1` row in `admin_users`.

Verification query (run immediately after step 2):

WARNING:
Paste only the SQL body into Supabase SQL Editor.
Do NOT paste markdown fences such as \`\`\`sql, sql, or \`\`\`.

```sql
with chosen_admin as (
  select id, email
  from auth.users
  order by created_at asc
  limit 1
)
select
  ca.id as auth_user_id,
  ca.email as auth_email,
  count(au.id) as admin_user_row_count,
  max(au.role) as admin_role,
  bool_or(au.is_active) as admin_is_active
from chosen_admin ca
left join admin_users au on au.id = ca.id
group by ca.id, ca.email;
```

Expected result:
- One row returned.
- `admin_user_row_count = 1`
- `admin_role = owner`
- `admin_is_active = true`

If any expected value does not match:
- STOP.
- Do not continue to Step 3.
- Fix admin bootstrap mapping and rerun Step 2 verification.

## Step 3: Run 003_demo_products.sql

What this seeds:
- Demo catalog data across:
  - `products` (8 deterministic IDs)
  - `product_specs` (replaced for those IDs, then inserted)
  - `product_media` (replaced for those IDs, then inserted)

Expected row counts after step (for seeded IDs):
- `products`: exactly `8`
- `products` where `is_visible = true`: exactly `8`
- `product_specs`: exactly `20`
- `product_media`: exactly `8`

Strict execution guard:
- If execution fails or verification counts do not match exactly, STOP. Do not proceed to final checks.
- Do NOT rerun blindly.
- Investigate constraint or insert errors first, then rerun only after root cause is fixed.

Verification query (run immediately after step 3):

WARNING:
Paste only the SQL body into Supabase SQL Editor.
Do NOT paste markdown fences such as \`\`\`sql, sql, or \`\`\`.

```sql
with seeded_ids as (
  select unnest(array[
    '10000000-0000-4000-8000-000000000001'::uuid,
    '10000000-0000-4000-8000-000000000002'::uuid,
    '10000000-0000-4000-8000-000000000003'::uuid,
    '10000000-0000-4000-8000-000000000004'::uuid,
    '10000000-0000-4000-8000-000000000005'::uuid,
    '10000000-0000-4000-8000-000000000006'::uuid,
    '10000000-0000-4000-8000-000000000007'::uuid,
    '10000000-0000-4000-8000-000000000008'::uuid
  ]) as id
)
select
  (select count(*) from products p join seeded_ids s on s.id = p.id) as seeded_products_count,
  (select count(*) from products p join seeded_ids s on s.id = p.id where p.is_visible = true) as seeded_visible_products_count,
  (select count(*) from product_specs ps join seeded_ids s on s.id = ps.product_id) as seeded_product_specs_count,
  (select count(*) from product_media pm join seeded_ids s on s.id = pm.product_id) as seeded_product_media_count;
```

Expected result:
- `seeded_products_count = 8`
- `seeded_visible_products_count = 8`
- `seeded_product_specs_count = 20`
- `seeded_product_media_count = 8`

If any count differs:
- STOP.
- Do not continue to final hosted checks.
- Investigate table constraints, enum/value mismatches, and failed inserts.

## Media Sanity Check

Run after Step 3 count verification:

WARNING:
Paste only the SQL body into Supabase SQL Editor.
Do NOT paste markdown fences such as \`\`\`sql, sql, or \`\`\`.

```sql
select product_id, original_url, thumb_url, full_url
from product_media
where product_id in (
  '10000000-0000-4000-8000-000000000001'::uuid,
  '10000000-0000-4000-8000-000000000002'::uuid
)
limit 5;
```

Expected result:
- Rows are returned.
- Each returned row has at least one non-null URL/path among `original_url`, `thumb_url`, `full_url`.

Purpose:
- Confirms media data required for frontend product image rendering is present.

If expectation fails:
- STOP.
- Fix media inserts before continuing.

## Product Type Verification

Run after Step 3 count verification:

WARNING:
Paste only the SQL body into Supabase SQL Editor.
Do NOT paste markdown fences such as \`\`\`sql, sql, or \`\`\`.

```sql
select product_type, count(*) as count
from products
where id in (
  '10000000-0000-4000-8000-000000000001'::uuid,
  '10000000-0000-4000-8000-000000000002'::uuid,
  '10000000-0000-4000-8000-000000000003'::uuid,
  '10000000-0000-4000-8000-000000000004'::uuid,
  '10000000-0000-4000-8000-000000000005'::uuid,
  '10000000-0000-4000-8000-000000000006'::uuid,
  '10000000-0000-4000-8000-000000000007'::uuid,
  '10000000-0000-4000-8000-000000000008'::uuid
)
group by product_type
order by product_type;
```

Expected result:
- Multiple product types are present (for example: `desktop`, `laptop`, `component`).

If expectation fails:
- STOP.
- Investigate product insert integrity before continuing.

## Final Hosted Anon-Visible Products Check (Phase 1 Gate)

SQL check (DB-level):

WARNING:
Paste only the SQL body into Supabase SQL Editor.
Do NOT paste markdown fences such as \`\`\`sql, sql, or \`\`\`.

```sql
select count(*) as visible_products_count
from products
where is_visible = true;
```

Expected result:
- `visible_products_count > 0` (non-exact threshold check)

REST check (anon-path parity with frontend):

```text
GET {SUPABASE_URL}/rest/v1/products?select=id,slug,title,is_visible&is_visible=eq.true&order=created_at.desc&limit=5
Headers:
  apikey: <VITE_SUPABASE_ANON_KEY>
  Authorization: Bearer <VITE_SUPABASE_ANON_KEY>
```

Expected result:
- At least one JSON row returned.
- Gate acceptance for Phase 1 runtime verification: `VISIBLE_COUNT > 0`.

If final SQL or REST check fails:
- STOP.
- Remain blocked in Phase 1.
- Do not claim Product Flow runtime verification complete.

## Stop Conditions

Stop and fix before moving forward if any of the following occurs:
1. Step 1 exact count is not `16`.
2. Pre-check auth user count is `0`.
3. Step 2 admin bootstrap verification does not match expected values.
4. Step 3 execution fails or exact counts differ (`8`, `8`, `20`, `8`).
5. Media sanity check fails.
6. Product type verification fails.
7. Final anon-visible SQL/REST check returns `0` rows.

Do not claim Phase 1 runtime verification complete until final anon-visible check passes.

## Phase 1 Unblock Conditions

Phase 1 Product Flow may resume ONLY when ALL conditions are true:

- spec definitions count = 16
- admin bootstrap verification passes
- seeded product/spec/media counts match exactly
- media sanity check returns valid rows
- product types distribution is valid
- anon REST visible products returns greater than or equal to 1 row

If any condition fails, remain blocked.