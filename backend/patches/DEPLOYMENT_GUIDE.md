## SUPABASE PATCH DEPLOYMENT GUIDE

### Issue Summary
Two confirmed issues blocking frontend RPC runtime tests:

1. **Cart RPC Type Mismatch** (Error 42804)
   - Functions: `get_or_create_customer_cart`, `get_cart_with_items`
   - Problem: Returning enum type for `status` instead of text
   - Fix: Add `::text` cast on all status field returns

2. **Build RPC Code Generation** (Error 23502)
   - Function: `create_or_get_custom_build`
   - Problem: `build_code` column not populated, violates NOT NULL constraint
   - Fix: Generate unique `build_code` before insert (pattern: `BUILD-YYMMDDHH24MI-NNNN`)

3. **Missing Test Data**
   - Problem: Test suite checks for ≥1 products, currently 0 exist
   - Fix: Seed 3 test products (1 regular, 1 CPU, 1 motherboard)

---

## DEPLOYMENT ORDER (Critical: Follow exactly)

### Step 1: Deploy Test Data
**File:** `backend/patches/TEST_DATA_SEED.sql`

1. Open [Supabase Dashboard](https://app.supabase.com)
2. Select project: **kzpknqwlecicildibiqt**
3. Navigate to: **SQL Editor** tab
4. Click: **New Query**
5. **Copy entire contents** of `TEST_DATA_SEED.sql`
6. **Paste** into SQL Editor
7. Click: **Run** button

**Expected Output:**
```
Query successful (no rows returned or "ON CONFLICT" message)
```

**Verification (run as separate query):**
```sql
SELECT COUNT(*) FROM products;
```
Expected: `3` or higher

---

### Step 2: Deploy Cart RPC Enum Fix
**File:** `backend/patches/CART_RPC_ENUM_FIX.sql`

1. In same SQL Editor, click: **New Query**
2. **Copy entire contents** of `CART_RPC_ENUM_FIX.sql`
3. **Paste** into SQL Editor
4. Click: **Run** button

**Expected Output:**
```
Query successful
```

**Verification (run as separate query):**
```sql
SELECT 
  c.id, 
  c.session_token, 
  c.status
FROM carts 
LIMIT 1;
```
Expected: `status` returned as text (e.g., `'active'`), not enum

---

### Step 3: Deploy Build RPC Code Generation Fix
**File:** `backend/patches/BUILD_RPC_CODE_GENERATION_FIX.sql`

1. In same SQL Editor, click: **New Query**
2. **Copy entire contents** of `BUILD_RPC_CODE_GENERATION_FIX.sql`
3. **Paste** into SQL Editor
4. Click: **Run** button

**Expected Output:**
```
Query successful
```

**Verification (run as separate query):**
```sql
SELECT 
  b.id,
  b.build_code,
  b.owner_type,
  b.name,
  b.build_status
FROM custom_builds
LIMIT 1;
```
Expected: `build_code` is NOT NULL (e.g., `BUILD-260406154530-7234`)

---

## POST-DEPLOYMENT VERIFICATION

Run tests to confirm all patches applied correctly:

```powershell
cd d:\projects\ys_store\frontend
npx vitest run src/tests/rpc-runtime.test.ts
```

**Expected Results:**
- ✅ Error 42804 (cart type mismatch) should disappear
- ✅ Error 23502 (build code null) should disappear
- ℹ️ Tests may still have other failures (RLS auth, etc.) - that's OK, patches are focused on confirmed issues only

**Sign of Success:** Fewer errors than before, tests actually execute RPC calls instead of erroring on type mismatches

---

## Rollback (If Needed)

Each SQL patch is idempotent (safe to re-run). If an error occurs:
1. Fix the issue in the `.sql` file
2. Re-run the same step (it will overwrite the previous function)
3. Re-run verification queries

No data mutation occurs—only function definitions are updated.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `syntax error` | Paste error | Copy entire file again, verify no truncation |
| `unknown type` | Function order | Run in exact order: Seeds → Cart → Build |
| `permission denied` | Credentials | Verify logged into correct Supabase project |
| `function already exists` | Normal | This is expected, CREATE OR REPLACE handles it |

---

## What These Patches Do NOT Fix

- RLS (Row-Level Security) isolation between guest sessions
- WhatsApp engagement tracking
- Quote creation workflow
- Custom build component compatibility validation

These are unrelated to confirmed type/null constraint errors and will be addressed separately.
