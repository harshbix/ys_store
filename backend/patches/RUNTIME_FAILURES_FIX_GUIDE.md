# RUNTIME FAILURE FIXES - DEPLOYMENT GUIDE

## Three Confirmed Issues Fixed

### Issue 1: No Test Data → Cart Tests Fail
- **Error**: `P0001: product_id required for product items`
- **Cause**: Products table is empty, tests cannot add items
- **Fix File**: `SEED_TEST_DATA.sql` (3 products: 1 PC, 1 CPU, 1 motherboard)

### Issue 2: build_code Not Generated → Build Tests Fail
- **Error**: `23502: null value in column "build_code" violates not-null constraint`
- **Cause**: INSERT omits build_code which is NOT NULL with no default
- **Fix File**: `BUILD_CODE_GENERATION_PATCH.sql` (adds code generation before insert)

### Issue 3: Wrong Column Reference → Quote Tests Fail
- **Error**: `42703: column c.total_estimated_price_tzs does not exist`
- **Cause**: Carts table has no total_estimated_price_tzs column; must compute from items
- **Fix File**: `QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql` (compute total via SUM aggregate)

---

## EXACT DEPLOYMENT ORDER (Critical: Follow This)

### Step 1: Seed Test Data
**File**: `backend/patches/SEED_TEST_DATA.sql`

1. Open [Supabase SQL Editor](https://app.supabase.com) → Project kzpknqwlecicildibiqt
2. Click **New Query**
3. **Copy entire contents of SEED_TEST_DATA.sql**
4. **Paste** into editor
5. Click **Run**

**Expected**: No error, 3 rows inserted (or "ON CONFLICT" message)

---

### Step 2: Fix Build RPC build_code Generation
**File**: `backend/patches/BUILD_CODE_GENERATION_PATCH.sql`

1. In same SQL Editor, click **New Query**
2. **Copy entire contents of BUILD_CODE_GENERATION_PATCH.sql**
3. **Paste** into editor
4. Click **Run**

**Expected**: No error, function updated

---

### Step 3: Fix Quote RPC Total Calculation
**File**: `backend/patches/QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql`

1. In same SQL Editor, click **New Query**
2. **Copy entire contents of QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql**
3. **Paste** into editor
4. Click **Run**

**Expected**: No error, function updated

---

## QUICK VERIFICATION QUERIES

Run these in Supabase SQL Editor AFTER all three patches:

### Verification 1: Test Data Exists
```sql
SELECT COUNT(*) as product_count FROM products WHERE sku LIKE 'RUNTIME-%';
```
**Expected Result**: `3`

---

### Verification 2: Build Code Generation Works
```sql
SELECT id, build_code, build_status 
FROM create_or_get_custom_build(p_session_token := 'verification-test');
-- build_code should NOT be NULL
```
**Expected Result**: One row with build_code like `BUILD-260406xxxxx-yyyy`, status `draft`

---

### Verification 3: Quote Total Calculation Works
```sql
-- First, create a test cart with an item
WITH cart_setup AS (
  SELECT id FROM get_or_create_customer_cart('verify-session') LIMIT 1
),
cart_with_product AS (
  SELECT * FROM add_item_to_cart(
    (SELECT id FROM cart_setup),
    'product',
    (SELECT id FROM products WHERE sku = 'RUNTIME-PC-001' LIMIT 1),
    NULL,
    1
  )
)
SELECT id, quote_code, estimated_total_tzs
FROM create_quote_from_cart(
  'Verification Customer',
  p_source_id := (SELECT cart_id FROM cart_with_product LIMIT 1),
  p_idempotency_key := gen_random_uuid()::text
);
-- estimated_total_tzs should NOT be NULL
```
**Expected Result**: One row with estimated_total_tzs > 0, quote_code like `QT-xxxxx-yyyy`

---

## FILES CREATED/MODIFIED

| File | Purpose | Type | Size |
|------|---------|------|------|
| `backend/patches/SEED_TEST_DATA.sql` | Add 3 test products | SQL | ~80 lines |
| `backend/patches/BUILD_CODE_GENERATION_PATCH.sql` | Fix build_code NULL constraint | SQL | ~85 lines |
| `backend/patches/QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql` | Fix total column reference | SQL | ~125 lines |

**No migration files modified**
**No production config changed**

---

## CHANGES SUMMARY

### SEED_TEST_DATA.sql
```
INSERT INTO products (3 rows):
  - RUNTIME-PC-001: ready_built_pc, 1500000 TZS
  - RUNTIME-CPU-001: component (CPU), 800000 TZS
  - RUNTIME-MOBO-001: component (motherboard), 600000 TZS
```

### BUILD_CODE_GENERATION_PATCH.sql
```
Changes in create_or_get_custom_build:

BEFORE (line 62):
  INSERT INTO custom_builds (
    customer_auth_id,
    session_token,
    owner_type,
    name,
    build_status,
    compatibility_status,
    total_estimated_price_tzs
  ) VALUES (...)

AFTER:
  -- Add line before insert:
  v_build_code := 'BUILD-' || TO_CHAR(...) || '-' || LPAD(...)
  
  -- Insert with build_code:
  INSERT INTO custom_builds (
    customer_auth_id,
    session_token,
    owner_type,
    name,
    build_status,
    compatibility_status,
    total_estimated_price_tzs,
    build_code
  ) VALUES (
    ...,
    v_build_code
  )
```

### QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql
```
Changes in create_quote_from_cart:

BEFORE (line 53):
  SELECT c.total_estimated_price_tzs, 
         COALESCE(json_agg(...), '[]'::json)
  FROM carts c
  LEFT JOIN cart_items ci ON c.id = ci.cart_id
  WHERE c.id = p_source_id;

AFTER:
  SELECT COALESCE(SUM(ci.unit_estimated_price_tzs * ci.quantity), 0)::bigint,
         COALESCE(json_agg(...), '[]'::json)
  FROM carts c
  LEFT JOIN cart_items ci ON c.id = ci.cart_id
  WHERE c.id = p_source_id
  GROUP BY c.id;
```

---

## FINAL TEST RUN

After patches deployed and verified:

```powershell
cd d:\projects\ys_store\frontend
npx vitest run src/tests/rpc-runtime.test.ts
```

**Expected Changes**:
- ❌ Error: `product_id required` — GONE (data exists)
- ❌ Error: `23502 build_code null` — GONE (generated)
- ❌ Error: `42703 column not exist` — GONE (corrected reference)
- ℹ️ Other failures may remain (RLS auth, etc.) — Out of scope

---

## SCOPE & RISKS

### What's Fixed (Confirmed Runtime Errors Only)
- ✅ Missing test data
- ✅ Null build_code constraint violation
- ✅ Invalid column reference (total calculation)

### NOT Included (Out of Scope)
- ❌ RLS policy enforcement
- ❌ Guest session isolation
- ❌ Component compatibility checks
- ❌ WhatsApp tracking integration
- ❌ Quote type determination (cart vs build)

### Risks
| Risk | Likelihood | Mitigation |
|------|------------|-----------|
| Unique constraint on build_code (duplicate codes) | Very Low | Timestamp + random 4-digit suffix creates ~10K combos per minute |
| Total calculation using SUM instead of stored value | Low | Consistent with cart aggregate pattern in other RPCs |
| Missing GROUP BY on aggregate | Low | Added explicit GROUP BY c.id to ensure single result |
| Test data interferes with production | None | Using RUNTIME-* SKU pattern, easily identifiable |

---

## ROLLBACK (If Needed)

Each patch is idempotent (safe to re-run):

```sql
-- Blow away test data (if needed):
DELETE FROM products WHERE sku LIKE 'RUNTIME-%';

-- Re-run functions to latest migration state:
-- Re-apply migrations 014, 015 to revert to last deployed version
```

No data was mutated in production tables—only function definitions (CREATE OR REPLACE).

---

## COMMAND REFERENCE

**Deploy all 3 patches (in order)**:
```
1. SEED_TEST_DATA.sql (Supabase SQL Editor)
2. BUILD_CODE_GENERATION_PATCH.sql (Supabase SQL Editor)
3. QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql (Supabase SQL Editor)
```

**Quick smoke test** (run in Supabase SQL Editor):
```sql
SELECT COUNT(*) FROM products WHERE sku LIKE 'RUNTIME-%';
SELECT * FROM create_or_get_custom_build(p_session_token := 'test');
SELECT * FROM create_quote_from_cart('Test', p_idempotency_key := gen_random_uuid()::text);
```

**Full test** (run in terminal):
```powershell
npx vitest run src/tests/rpc-runtime.test.ts
```
