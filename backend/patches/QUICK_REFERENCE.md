# RUNTIME FAILURES FIX - QUICK REFERENCE

## Files Created (4 files)

```
d:\projects\ys_store\backend\patches\
├── SEED_TEST_DATA.sql                           (Insert 3 test products)
├── BUILD_CODE_GENERATION_PATCH.sql              (Fix build_code NULL constraint)
├── QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql        (Fix total column reference)
├── RUNTIME_FAILURES_FIX_GUIDE.md                (Deployment guide)
└── ROOT_CAUSE_ANALYSIS.md                       (This document)
```

---

## Deployment Order (CRITICAL: Follow This)

### 1️⃣ Seed Test Data
```bash
File: backend/patches/SEED_TEST_DATA.sql
Location: Supabase SQL Editor
Action: Copy → Paste → Run
Result: 3 rows inserted (or "ON CONFLICT")
```

### 2️⃣ Fix Build RPC
```bash
File: backend/patches/BUILD_CODE_GENERATION_PATCH.sql
Location: Supabase SQL Editor
Action: Copy → Paste → Run
Result: Function updated
```

### 3️⃣ Fix Quote RPC
```bash
File: backend/patches/QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql
Location: Supabase SQL Editor
Action: Copy → Paste → Run
Result: Function updated
```

---

## Quick Smoke Tests (Run in Supabase SQL Editor)

```sql
-- Test 1: Data exists
SELECT COUNT(*) FROM products WHERE sku LIKE 'RUNTIME-%';
-- Expected: 3

-- Test 2: Build code generated (not NULL)
SELECT id, build_code, build_status
FROM create_or_get_custom_build(p_session_token := 'test-verification');
-- Expected: build_code is NOT NULL, e.g., 'BUILD-260406154530-1234'

-- Test 3: Quote total calculated (not NULL)
SELECT estimated_total_tzs FROM create_quote_from_cart(
  'Verification Customer',
  p_idempotency_key := gen_random_uuid()::text
);
-- Expected: bigint value, e.g., 1500000
```

---

## Full Test

```powershell
cd d:\projects\ys_store\frontend
npx vitest run src/tests/rpc-runtime.test.ts
```

**Expected Results**:
- ❌ "product_id required" → GONE
- ❌ "23502 build_code null" → GONE  
- ❌ "42703 column not exist" → GONE

---

## What's Fixed

| Error | Root Cause | Status |
|-------|-----------|--------|
| P0001: product_id required | No products in DB | ✅ SEED_TEST_DATA.sql |
| 23502: build_code null | INSERT omits column | ✅ BUILD_CODE_GENERATION_PATCH.sql |
| 42703: column not exist | Wrong table reference | ✅ QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql |

---

## Inside Each Patch

### SEED_TEST_DATA.sql
```sql
INSERT INTO products (3 rows):
1. RUNTIME-PC-001 / ready_built_pc / 1,500,000 TZS
2. RUNTIME-CPU-001 / component (CPU) / 800,000 TZS
3. RUNTIME-MOBO-001 / component (motherboard) / 600,000 TZS
```

### BUILD_CODE_GENERATION_PATCH.sql
```sql
Changes to create_or_get_custom_build:
├── Add variable: v_build_code text;
├── Generate code: v_build_code := 'BUILD-' || TO_CHAR(...) || '-' || LPAD(...)
└── Include in INSERT: add build_code column + v_build_code value
```

### QUOTE_RPC_TOTAL_CALCULATION_PATCH.sql
```sql
Changes to create_quote_from_cart:
├── Replace: c.total_estimated_price_tzs (nonexistent column)
├── With: SUM(ci.unit_estimated_price_tzs * ci.quantity) (computed from items)
└── Add: GROUP BY c.id (required for aggregate)
```

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|-----------|
| Duplicate build_code | Very Low | Timestamp + random 4-digit suffix (10K/min) |
| Incorrect total calculation | Low | Matches existing pattern in `get_cart_with_items` |
| Test data interferes | None | Using RUNTIME-* SKU pattern, easily identifiable |
| Revert needed | Low | All changes are idempotent (safe to re-run) |

---

## Files Changed Summary

**Modified**: 0 migration files (safe approach)
**Created**: 3 SQL patches + 2 documentation files
**Scope**: Limited to confirmed runtime defects only
**Review**: Line-by-line changes documented in ROOT_CAUSE_ANALYSIS.md

---

## Backup/Verification Queries

If deployment encounters issues:

```sql
-- Verify products inserted
SELECT sku, title, estimated_price_tzs
FROM products WHERE sku LIKE 'RUNTIME-%'
ORDER BY sku;

-- Inspect build function (verify code generation)
SELECT pg_get_functiondef('create_or_get_custom_build(uuid,text,text)'::regprocedure);

-- Inspect quote function (verify total calculation)
SELECT pg_get_functiondef('create_quote_from_cart(text,text,text,uuid,text)'::regprocedure);
```

---

## One-Line Summary

Apply 3 SQL patches (seed data + 2 RPC fixes) to unblock cart/build/quote runtime tests.
