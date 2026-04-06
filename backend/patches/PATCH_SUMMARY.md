# PATCH DEPLOYMENT SUMMARY

## File Manifest

Location: `backend/patches/`

| File | Purpose | Size | Type |
|------|---------|------|------|
| `TEST_DATA_SEED.sql` | Seed 3 test products (cart, CPU, motherboard) | ~400 lines | SQL |
| `CART_RPC_ENUM_FIX.sql` | Fix cart_status enum→text casting in 2 RPC functions | ~120 lines | SQL |
| `BUILD_RPC_CODE_GENERATION_FIX.sql` | Fix missing build_code generation in 1 RPC function | ~90 lines | SQL |
| `DEPLOYMENT_GUIDE.md` | Step-by-step deployment instructions | ~150 lines | Markdown |
| `VERIFICATION_QUERIES.sql` | Quick SQL queries to validate each patch | ~80 lines | SQL |
| `PATCH_SUMMARY.md` | This file | - | Markdown |

---

## Issues Fixed

### Issue 1: Cart RPC Type Mismatch (Error 42804)
- **Scope**: Limited to cart operations
- **Root Cause**: Enum column returned as enum type instead of text in RPC return
- **Affected Functions**: 
  - `get_or_create_customer_cart()` [2 return branches]
  - `get_cart_with_items()` [1 return branch]
- **Fix**: Add `::text` cast to `status` field in all return branches
- **Risk**: None - purely type casting, no logic change
- **Deployed By**: `CART_RPC_ENUM_FIX.sql`

### Issue 2: Build RPC Code Generation (Error 23502)
- **Scope**: Limited to build creation
- **Root Cause**: INSERT statement omits required `build_code` column (no default)
- **Affected Functions**: 
  - `create_or_get_custom_build()` [1 insert location]
- **Fix**: Generate unique `build_code` before insert using pattern: `BUILD-YYMMDDHH24MI-NNNN`
- **Risk**: Minimal - follows established pattern from quote code generation
- **Deployed By**: `BUILD_RPC_CODE_GENERATION_FIX.sql`

### Issue 3: No Test Data
- **Scope**: Test data only, non-blocking for patch deployment
- **Root Cause**: Products table empty, tests skip if no data found
- **Fix**: Insert 3 test products (ready-built PC, CPU component, motherboard component)
- **Risk**: None - seed data only
- **Deployed By**: `TEST_DATA_SEED.sql`

---

## Deployment Checklist

**Before Deployment:**
- [ ] Verify you have access to Supabase project `kzpknqwlecicildibiqt`
- [ ] Confirm patches are in `backend/patches/` directory
- [ ] Check you're logged into correct Supabase dashboard

**Deployment Steps (In This Order):**
1. [ ] Run `TEST_DATA_SEED.sql` 
   - Verify: `SELECT COUNT(*) FROM products;` returns ≥3
2. [ ] Run `CART_RPC_ENUM_FIX.sql`
   - Verify: `SELECT pg_get_functiondef('get_or_create_customer_cart(uuid,text)'::regprocedure);` contains `::text` casts
3. [ ] Run `BUILD_RPC_CODE_GENERATION_FIX.sql`
   - Verify: `SELECT pg_get_functiondef('create_or_get_custom_build(uuid,text,text)'::regprocedure);` contains `v_build_code :=` line

**Post-Deployment:**
- [ ] Run: `npx vitest run src/tests/rpc-runtime.test.ts`
- [ ] Verify: No Error 42804 (cart type)
- [ ] Verify: No Error 23502 (build code)
- [ ] Note: Other test failures may remain (not in scope of these patches)

---

## What's NOT Included in These Patches

These patches are **narrowly scoped** to confirmed errors only:

- ❌ RLS policy fixes (guest session isolation)
- ❌ Quote creation workflow
- ❌ Component compatibility validation
- ❌ WhatsApp integration
- ❌ Cart item specs snapshot generation
- ❌ Migration history changes

---

## Minimal Changes Principle

Each patch:
- Modifies **exactly** the functions with confirmed errors
- Makes **only** the minimal fix needed
- Uses **existing patterns** from codebase (quote code format)
- **Does not touch** unrelated functions
- **Is idempotent** (safe to re-run)

---

## Quick Command Reference

**Deploy all patches:**
```bash
# Open Supabase SQL Editor and run in order:
1. backend/patches/TEST_DATA_SEED.sql
2. backend/patches/CART_RPC_ENUM_FIX.sql
3. backend/patches/BUILD_RPC_CODE_GENERATION_FIX.sql
```

**Verify patches applied:**
```sql
-- Run these in Supabase SQL Editor
SELECT COUNT(*) FROM products WHERE sku LIKE 'TST-%';  -- Should be 3+
SELECT * FROM get_or_create_customer_cart('test');  -- Should not error on type
SELECT * FROM create_or_get_custom_build(p_session_token := 'test');  -- Should not error on null
```

**Run frontend tests:**
```powershell
cd d:\projects\ys_store\frontend
npx vitest run src/tests/rpc-runtime.test.ts
```

---

## Files Location

```
d:\projects\ys_store\
├── backend\
│   └── patches\
│       ├── TEST_DATA_SEED.sql
│       ├── CART_RPC_ENUM_FIX.sql
│       ├── BUILD_RPC_CODE_GENERATION_FIX.sql
│       ├── DEPLOYMENT_GUIDE.md
│       ├── VERIFICATION_QUERIES.sql
│       └── PATCH_SUMMARY.md (this file)
```
