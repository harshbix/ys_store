# PATCH CODE CHANGES - LINE BY LINE

## Patch 1: CART_RPC_ENUM_FIX.sql

### Change 1a: get_or_create_customer_cart - First RETURN QUERY (Line ~43)

**BEFORE (Deployed Version - Missing Casts):**
```sql
RETURN QUERY
SELECT c.id, c.session_token, c.customer_auth_id, c.status, c.created_at, c.updated_at, c.expires_at
FROM carts c
WHERE c.id = v_cart_id;
```

**AFTER (Patch Includes):**
```sql
RETURN QUERY
SELECT c.id, c.session_token, c.customer_auth_id, c.status::text, c.created_at, c.updated_at, c.expires_at
FROM carts c
WHERE c.id = v_cart_id;
```

**Change**: Added `::text` cast to `c.status`
**Why**: Function signature declares `status text`, but enum column returns enum type without cast

---

### Change 1b: get_or_create_customer_cart - Second RETURN QUERY (Line ~56)

**BEFORE (Deployed Version - Missing Casts):**
```sql
RETURN QUERY
SELECT c.id, c.session_token, c.customer_auth_id, c.status, c.created_at, c.updated_at, c.expires_at
FROM carts c
WHERE c.id = v_cart_id;
```

**AFTER (Patch Includes):**
```sql
RETURN QUERY
SELECT c.id, c.session_token, c.customer_auth_id, c.status::text, c.created_at, c.updated_at, c.expires_at
FROM carts c
WHERE c.id = v_cart_id;
```

**Change**: Added `::text` cast to `c.status`
**Why**: Both return branches must match function signature

---

### Change 1c: get_cart_with_items - Single RETURN QUERY (Line ~75)

**BEFORE (Deployed Version - Missing Casts):**
```sql
SELECT
  c.id,
  c.session_token,
  c.customer_auth_id,
  c.status,
  COALESCE(...)
```

**AFTER (Patch Includes):**
```sql
SELECT
  c.id,
  c.session_token,
  c.customer_auth_id,
  c.status::text,
  COALESCE(...)
```

**Change**: Added `::text` cast to `c.status`
**Why**: Return type signature declares `status text`, function must match

---

## Patch 2: BUILD_RPC_CODE_GENERATION_FIX.sql

### Change 2a: create_or_get_custom_build - Add Variable Declaration (Line ~20)

**BEFORE (Deployed Version):**
```sql
DECLARE
  v_build_id uuid;
  v_owner_type build_owner_type;
BEGIN
```

**AFTER (Patch Includes):**
```sql
DECLARE
  v_build_id uuid;
  v_build_code text;
  v_owner_type build_owner_type;
BEGIN
```

**Change**: Added `v_build_code text;` variable
**Why**: Need variable to store generated code before insert

---

### Change 2b: create_or_get_custom_build - Add Code Generation (Line ~55, new location)

**BEFORE (Deployed Version):**
```sql
  -- If exists, return it
  IF v_build_id IS NOT NULL THEN
    RETURN QUERY
    SELECT ...
    RETURN;
  END IF;

  -- Create new build
  INSERT INTO custom_builds (
```

**AFTER (Patch Includes):**
```sql
  -- If exists, return it
  IF v_build_id IS NOT NULL THEN
    RETURN QUERY
    SELECT ...
    RETURN;
  END IF;

  -- Generate build code
  v_build_code := 'BUILD-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYMMDDHH24MI') || '-' || LPAD((RANDOM() * 9999)::int::text, 4, '0');

  -- Create new build
  INSERT INTO custom_builds (
```

**Change**: Added 1 line before INSERT to generate unique code
**Why**: `build_code` column is NOT NULL unique, must be provided at insert time

---

### Change 2c: create_or_get_custom_build - Include build_code in INSERT (Line ~60)

**BEFORE (Deployed Version):**
```sql
INSERT INTO custom_builds (
  customer_auth_id,
  session_token,
  owner_type,
  name,
  build_status,
  compatibility_status,
  total_estimated_price_tzs
) VALUES (
  p_customer_auth_id,
  p_session_token,
  v_owner_type,
  COALESCE(p_name, 'My Custom Build'),
  'draft'::build_status,
  'warning'::compatibility_status,
  0
)
```

**AFTER (Patch Includes):**
```sql
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
  p_customer_auth_id,
  p_session_token,
  v_owner_type,
  COALESCE(p_name, 'My Custom Build'),
  'draft'::build_status,
  'warning'::compatibility_status,
  0,
  v_build_code
)
```

**Change**: 
1. Added `build_code` to column list
2. Added `v_build_code` to values list (matching position)

**Why**: Provides the generated code value for the required column

---

## Patch 3: TEST_DATA_SEED.sql

### Three INSERT Statements

**Product 1 - Regular Product (for cart tests):**
- SKU: `TST-PROD-001`
- Title: `Test Product 1`
- Type: `ready_built_pc`
- Price: 500,000 TZS
- Purpose: Cart flow tests

**Product 2 - CPU Component (for build tests):**
- SKU: `TST-CPU-001`
- Title: `Test Intel i7 CPU`
- Type: `component`
- Category: `cpu` (via title context)
- Price: 350,000 TZS
- Purpose: Custom build component addition

**Product 3 - Motherboard Component (for replacement tests):**
- SKU: `TST-MOBO-001`
- Title: `Test ASUS Motherboard`
- Type: `component`
- Category: `motherboard` (via title context)
- Price: 200,000 TZS
- Purpose: Component replacement flow (replaces CPU with motherboard)

**Conflict Handling:**
- All INSERTs use `ON CONFLICT (sku) DO NOTHING`
- Safe to re-run multiple times without duplicates
- Idempotent pattern

---

## Summary of Changes

| Patch | Function | Change Type | Lines Modified | Risk |
|-------|----------|-------------|-----------------|------|
| Cart Enum Fix | get_or_create_customer_cart | Type Cast | 2 (1 each return) | None |
| Cart Enum Fix | get_cart_with_items | Type Cast | 1 | None |
| Build Code Gen | create_or_get_custom_build | Logic Add | 4 (1 var + 1 gen + 2 insert) | Low |
| Test Data | N/A (seed) | Insert | 3 inserts | None |

**Total Changes**: 13 lines of SQL across 2 functions + 3 seed records

**No deletion, no refactoring, no production config changes**
