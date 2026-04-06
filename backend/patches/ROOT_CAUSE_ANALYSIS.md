# RUNTIME FAILURES - ROOT CAUSE ANALYSIS & FIXES

## Failure 1: Cart Tests → "product_id required for product items"

### Root Cause
**Location**: Test execution on hosted Supabase
**Problem**: `add_item_to_cart` RPC receives NULL `p_product_id` because NO PRODUCTS exist in the database

**RPC Logic** (excerpt from migration 012):
```sql
CREATE OR REPLACE FUNCTION add_item_to_cart(
  p_item_type text,
  p_product_id uuid DEFAULT NULL,  -- <-- NULL because test never found a product
  ...
)
...
IF p_item_type = 'product' THEN
  IF p_product_id IS NULL THEN
    RAISE EXCEPTION 'product_id required for product items';  -- <-- This line executes
  END IF;
```

**Why it Fails**:
1. Test calls: `add_item_to_cart(cart_id, 'product', <product_id_from_db>, NULL, 1)`
2. Test tries: `SELECT id FROM products LIMIT 1` → Returns no rows
3. Test falls back or skips, OR passes NULL
4. RPC checks: `IF p_product_id IS NULL` → TRUE → Exception thrown

**Why Seed Was Missing**:
- Migration 013 creates products table but doesn't seed test data
- No fixture or setup in test suite to create products
- Tests were written to "auto-skip if no products" but test runner doesn't skip, it fails

### Fix: SEED_TEST_DATA.sql
```sql
INSERT INTO products (...) VALUES
  ('RUNTIME-PC-001', 'ready_built_pc', 1500000 TZS),
  ('RUNTIME-CPU-001', 'component', 800000 TZS),
  ('RUNTIME-MOBO-001', 'component', 600000 TZS);
```

**Effect**: `SELECT id FROM products LIMIT 1` now returns a valid UUID
**Test Impact**: Cart tests can now add valid product items

---

## Failure 2: Build Tests → "null value in column build_code violates not-null constraint"

### Root Cause
**Location**: Migration 014, function `create_or_get_custom_build`, line 62-72
**Problem**: INSERT statement omits `build_code` column, which is NOT NULL unique with no DEFAULT

**Table Definition** (migration 003, excerpt):
```sql
create table if not exists custom_builds (
  id uuid primary key default gen_random_uuid(),
  build_code text not null unique,  -- <-- NOT NULL, no DEFAULT
  owner_type build_owner_type not null,
  ...
);
```

**Current RPC Code** (migration 014, line 62-72):
```sql
INSERT INTO custom_builds (
  customer_auth_id,
  session_token,
  owner_type,
  name,
  build_status,
  compatibility_status,
  total_estimated_price_tzs
  -- ❌ MISSING: build_code
) VALUES (
  p_customer_auth_id,
  p_session_token,
  v_owner_type,
  COALESCE(p_name, 'My Custom Build'),
  'draft'::build_status,
  'warning'::compatibility_status,
  0
  -- ❌ MISSING: no value for build_code
);
```

**PostgreSQL Behavior**:
When INSERT omits a column that is NOT NULL:
1. No DEFAULT exists for `build_code`
2. PostgreSQL tries to assign NULL
3. NOT NULL constraint fires
4. Error 23502: `null value in column "build_code"`

### Fix: BUILD_CODE_GENERATION_PATCH.sql

**Change 1**: Add variable declaration (line 21)
```sql
DECLARE
  v_build_id uuid;
  v_build_code text;  -- <-- NEW
  v_owner_type build_owner_type;
```

**Change 2**: Generate code before insert (line 57, new)
```sql
-- If exists, return it
IF v_build_id IS NOT NULL THEN
  RETURN QUERY ...
  RETURN;
END IF;

-- Generate unique build_code before insert
v_build_code := 'BUILD-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYMMDDHH24MI') || '-' || LPAD((RANDOM() * 9999)::int::text, 4, '0');

-- Create new build
INSERT INTO custom_builds (
```

**Change 3**: Include in INSERT (line 62-72 updated)
```sql
INSERT INTO custom_builds (
  customer_auth_id,
  session_token,
  owner_type,
  name,
  build_status,
  compatibility_status,
  total_estimated_price_tzs,
  build_code  -- <-- ADDED
) VALUES (
  p_customer_auth_id,
  p_session_token,
  v_owner_type,
  COALESCE(p_name, 'My Custom Build'),
  'draft'::build_status,
  'warning'::compatibility_status,
  0,
  v_build_code  -- <-- ADDED
);
```

**Why This Approach**:
- Matches pattern from `create_quote_from_cart` (migration 015, line 84):
  ```sql
  v_quote_code := 'QT-' || TO_CHAR(...) || '-' || LPAD(...)
  ```
- Timestamp (YYMMDDHH24MI) provides ordering and debugging
- Random 4-digit suffix (0000-9999) ensures uniqueness
- ~10K possible codes per minute = collision-resistant for typical load

**Test Impact**: Build tests can now create custom_builds without constraint violation

---

## Failure 3: Quote Tests → "column c.total_estimated_price_tzs does not exist"

### Root Cause
**Location**: Migration 015, function `create_quote_from_cart`, line 53
**Problem**: Query references `c.total_estimated_price_tzs`, but table `carts` has no totalcolumn

**Table Definition** (migration 003, excerpt):
```sql
create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  session_token text unique,
  customer_auth_id uuid,
  status cart_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
  -- ❌ NO total_estimated_price_tzs column
);
```

**Current RPC Code** (migration 015, line 53-69):
```sql
SELECT c.total_estimated_price_tzs,  -- ❌ WRONG: carts has no such column
       COALESCE(
         json_agg(
           json_build_object(
             'item_type', ci.item_type::text,
             'product_id', ci.product_id,
             ...
             'line_total_tzs', ci.quantity * ci.unit_estimated_price_tzs
           ) ORDER BY ci.created_at
         ),
         '[]'::json
       )
INTO v_total_tzs, v_items_json
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
WHERE c.id = p_source_id;
-- ❌ MISSING: GROUP BY for aggregate
```

**PostgreSQL Behavior**:
1. Table alias `c` refers to carts
2. Carts has: id, session_token, customer_auth_id, status, created_at, updated_at, expires_at
3. No `total_estimated_price_tzs` column exists
4. Error 42703: Column does not exist

**Design Issue**:
- Carts stores ITEMS in cart_items table
- Each item has unit_estimated_price_tzs × quantity
- Total must be COMPUTED, not stored

### Fix: QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql

**Change**: Rewrite the SELECT query (line 53-67)

**BEFORE**:
```sql
SELECT c.total_estimated_price_tzs,  -- ❌ Column doesn't exist
       COALESCE(json_agg(...), '[]'::json)
INTO v_total_tzs, v_items_json
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
WHERE c.id = p_source_id;
```

**AFTER**:
```sql
SELECT COALESCE(SUM(ci.unit_estimated_price_tzs * ci.quantity), 0)::bigint,  -- ✅ Compute from items
       COALESCE(json_agg(...), '[]'::json)
INTO v_total_tzs, v_items_json
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
WHERE c.id = p_source_id
GROUP BY c.id;  -- ✅ Required for aggregate
```

**Why This Works**:
- `SUM(ci.unit_estimated_price_tzs * ci.quantity)` computes total from items
- Falls through to 0 if no items (COALESCE)
- Cast to bigint matches return type
- `GROUP BY c.id` ensures single row output (required with aggregate)
- Matches pattern from `get_cart_with_items` (migration 012, line 119):
  ```sql
  COALESCE(SUM(ci.unit_estimated_price_tzs * ci.quantity), 0)::bigint,
  ...
  GROUP BY c.id, ...
  ```

**Test Impact**: Quote tests can now calculate totals from cart items without column errors

---

## Summary of Fixes

| Issue | Root Cause | Fix | File | Method |
|-------|-----------|-----|------|--------|
| No products | Missing seed data | INSERT 3 test products | SEED_TEST_DATA.sql | Data |
| Null build_code | INSERT omits column | Generate code + add to INSERT | BUILD_CODE_GENERATION_PATCH.sql | Logic |
| Missing column | Wrong table reference | Compute total from items + GROUP BY | QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql | Query |

---

## Verification Strategy

After applying patches, these queries MUST work:

```sql
-- Patch 1 verification
SELECT COUNT(*) FROM products WHERE sku LIKE 'RUNTIME-%';
-- Should return: 3

-- Patch 2 verification
SELECT build_code FROM create_or_get_custom_build(p_session_token := 'test');
-- Should return: build_code NOT NULL (e.g., 'BUILD-260406154530-7234')

-- Patch 3 verification
WITH cart AS (
  SELECT id FROM get_or_create_customer_cart('test-session')
),
cart_items AS (
  SELECT * FROM add_item_to_cart(
    (SELECT id FROM cart),
    'product',
    (SELECT id FROM products WHERE sku = 'RUNTIME-PC-001'),
    NULL,
    1
  )
)
SELECT estimated_total_tzs FROM create_quote_from_cart(
  'Test Customer',
  p_source_id := (SELECT id FROM cart),
  p_idempotency_key := gen_random_uuid()::text
);
-- Should return: estimated_total_tzs as non-NULL bigint
```

---

## No RPC Logic Changes

These patches fix ONLY:
- ✅ Missing data (seed)
- ✅ Missing column in INSERT (build_code)
- ✅ Wrong table column reference (compute total)

Do NOT change:
- ❌ Business logic (product validation, idempotency, etc.)
- ❌ Function signatures
- ❌ Table schemas
- ❌ RLS policies
- ❌ Other RPC functions
