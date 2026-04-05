# RPC DEPLOYMENT & RUNTIME VALIDATION GUIDE

## Overview
This guide walks through deploying the 4 RPC migrations and validating all runtime behaviors.

---

## PHASE 1: MIGRATION DEPLOYMENT

### Step 1: Access Supabase Dashboard SQL Editor
1. Go to your Supabase project: https://app.supabase.com/projects
2. Select your project (kzpknqwlecicildibiqt)
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Deploy Migration 012 (Cart RPC)
**File**: `backend/supabase/migrations/012_create_cart_management_rpc.sql`

1. Copy the entire file content
2. Paste into SQL Editor
3. Click **Run**
4. Expected result: `Success. 5 new functions created`
   - get_or_create_customer_cart
   - get_cart_with_items
   - add_item_to_cart
   - remove_item_from_cart
   - update_cart_item_quantity

### Step 3: Deploy Migration 013 (Product Creation RPC)
**File**: `backend/supabase/migrations/013_create_product_creation_rpc.sql`

1. Copy the entire file content
2. Paste into new SQL Editor tab
3. Click **Run**
4. Expected result: `Success. 2 new functions created`
   - create_product_with_specs
   - update_product_with_specs

### Step 4: Deploy Migration 014 (Build Management RPC)
**File**: `backend/supabase/migrations/014_create_build_management_rpc.sql`

1. Copy the entire file content
2. Paste into new SQL Editor tab
3. Click **Run**
4. Expected result: `Success. 5 new functions created`
   - create_or_get_custom_build
   - get_custom_build_with_items
   - upsert_custom_build_item
   - delete_custom_build_item
   - validate_custom_build

### Step 5: Deploy Migration 015 (Quote Creation RPC)
**File**: `backend/supabase/migrations/015_create_quote_creation_rpc.sql`

1. Copy the entire file content
2. Paste into new SQL Editor tab
3. Click **Run**
4. Expected result: `Success. 3 new functions created`
   - create_quote_from_cart
   - track_quote_whatsapp_click
   - get_quote_with_items

✅ **All 4 migrations deployed**: 15 RPC functions created total

---

## PHASE 2: FUNCTIONAL VALIDATION (SQL Tests)

### Prerequisites
- At least 1 product must exist in the database
- At least 1 component type product (for build tests)

### Run SQL Test Suite
1. Go to Supabase SQL Editor
2. Copy entire content from `RPC_RUNTIME_TESTS.sql`
3. Paste into SQL Editor
4. Click **Run**

### Expected Results
All 10 test blocks should execute without errors:

```
TEST PASSED: Created cart [uuid] for session [uuid]
TEST PASSED: Added item to cart, total: [bigint]
TEST PASSED: Duplicate detection works, items: 1
TEST PASSED: Created build [uuid] with code [code]
TEST PASSED: Added CPU component, total: [bigint]
TEST PASSED: Validation detected missing: [array of components]
TEST PASSED: Idempotency works, created quote [code] once
TEST PASSED: Retrieved quote [code] with 1 items
TEST PASSED: WhatsApp click tracked at [timestamp]
TEST PASSED: Totals recalculated correctly: X -> Y -> Z

✓ All SQL RPC tests completed successfully!
```

### What Each Test Validates

| # | Test | Validates |
|---|------|-----------|
| 1 | get_or_create_customer_cart | RPC creates cart from session token |
| 2 | add_item_to_cart | Product adding and price lookup works |
| 3 | Duplicate detection | Same item twice increases qty, not count |
| 4 | create_or_get_custom_build | Build creation with unique code |
| 5 | upsert_custom_build_item | Component adding recalculates total |
| 6 | validate_custom_build | Missing component detection |
| 7 | Idempotency | Same key returns same quote |
| 8 | get_quote_with_items | Quote retrieval with items array |
| 9 | WhatsApp tracking | Timestamp persistence on click |
| 10 | Total recalculation | Totals update on qty changes |

---

## PHASE 3: FRONTEND INTEGRATION TESTING

### Prerequisites
- Migrations 012-015 deployed
- Node.js and npm installed
- Frontend dev server running or test environment set up

### Setup Test Environment
```bash
cd frontend
npm install vitest    # if not already installed
```

### Run Frontend RPC Tests
```bash
npx vitest run RPC_RUNTIME_TESTS.ts
```

### Expected Output
```
✓ RPC Runtime Validation
  ✓ Cart Flow (5 tests)
    ✓ should create new cart via get_or_create_customer_cart
    ✓ should add product to cart
    ✓ should recalculate totals on quantity update
    ✓ should detect duplicate items and merge quantities
    ✓ should remove cart item

  ✓ Build Flow (5 tests)
    ✓ should create new custom build
    ✓ should add component to build
    ✓ should replace component when same type added
    ✓ should validate build and detect missing components
    ✓ should delete build item

  ✓ Quote Flow (5 tests)
    ✓ should create quote from cart
    ✓ should enforce idempotency
    ✓ should track WhatsApp click
    ✓ should retrieve quote with items
    ✓ should handle multiple quotes

  ✓ RLS Security (1 test)
    ✓ guest session should not access another guests cart

PASS  RPC_RUNTIME_TESTS.ts (16 tests)
```

### Troubleshooting Test Failures

**Error: "Cannot run migrations"**
- Ensure migrations 012-015 executed successfully in Supabase Dashboard
- Check Supabase dashboard → SQL Editor → Function Explorer for the 15 functions

**Error: "No products in database"**
- Add test products: Go to Supabase Dashboard → Table Editor → Products → Insert test data

**Error: "Function not found"**
- Verify function names exactly match RPC calls
- Go to Database → Functions in Supabase dashboard
- Should see all 15 functions listed

---

## PHASE 4: MANUAL END-TO-END TESTING

### Test Scenario 1: Guest Cart Flow
1. Open frontend in **private/incognito browser window**
2. Click **Add to Cart** on any product
3. **Expected**: 
   - No errors in browser console
   - Product appears in cart
   - Cart total updates correctly
4. Refresh page
5. **Expected**: Cart persists (guest session token stored in localStorage)
6. Add another of same product
7. **Expected**: Quantity increases to 2, total doubles
8. Delete item
9. **Expected**: Item removed, total becomes 0

### Test Scenario 2: Custom Build Flow
1. Go to **Builds** page
2. Click **Create New Build**
3. **Expected**: Build created, build code displayed
4. Add CPU component
5. **Expected**: Price appears, total recalculates
6. Click **Validate**
7. **Expected**: Shows missing components (motherboard, RAM, storage, PSU)
8. Try to add to cart
9. **Expected**: Success (can add incomplete build to cart)

### Test Scenario 3: Quote Creation
1. Add product to cart
2. Go to **Create Quote**
3. Enter customer name
4. Click **Create**
5. **Expected**: Quote code generated, WhatsApp link appears
6. Note the quote code
7. Go to quote detail page
8. Click **WhatsApp Share**
9. **Expected**: Timestamp shows in quote (click tracked)

### Test Scenario 4: Idempotency
1. Add product to cart
2. Create quote with name "Test Customer"
3. **Note quote code**
4. Create another quote (WITHOUT changing anything)
5. **Expected**: Same quote code returned (no duplicate)
6. Check database: Only 1 quote should exist with same idempotency key

### Test Scenario 5: RLS Security
1. **In Window A** (Session Token = ABC):
   - Add product to cart
   - Note cart ID
2. **In Window B** (Session Token = XYZ):
   - Try to access Window A's cart directly via API
   - **Expected**: Fails or returns no data (RLS blocks)
3. Create quote in Window A
4. Try to view it from Window B
5. **Expected**: Cannot access (RLS blocks)

---

## PHASE 5: VALIDATION CHECKLIST

### ✅ Deployment Phase
- [ ] Migration 012 deployed (5 functions)
- [ ] Migration 013 deployed (2 functions)
- [ ] Migration 014 deployed (5 functions)
- [ ] Migration 015 deployed (3 functions)
- [ ] Total: 15 RPC functions created

### ✅ SQL Tests Phase
- [ ] All 10 SQL tests pass
- [ ] No errors in test output
- [ ] All data types returned correctly

### ✅ Frontend Integration Phase
- [ ] Vitest suite passes all tests
- [ ] No TypeScript errors
- [ ] No runtime exceptions

### ✅ Manual Testing Phase
- [ ] Guest cart persists after refresh
- [ ] Duplicate items merge (qty increases, count stable)
- [ ] Totals recalculate on add/update/delete
- [ ] Build validation blocks incomplete configs
- [ ] Quote idempotency prevents duplicates
- [ ] WhatsApp click tracking persists
- [ ] RLS prevents access to other users' data

### ✅ Browser Console
- [ ] No errors in desktop browser
- [ ] No errors in mobile browser
- [ ] No API 500 errors
- [ ] No "function not found" errors

### ✅ Database Query Performance
- [ ] Cart operations return in <500ms
- [ ] Quote creation returns in <1000ms
- [ ] Validation completes in <500ms

---

## ROLLBACK PROCEDURE (If Needed)

If any migration fails in production:

1. **Identify the problem**: Check Supabase error logs
2. **Document the error**: Save error message
3. **Rollback single migration**:
   ```sql
   -- In Supabase SQL Editor
   DROP FUNCTION IF EXISTS function_name(params) CASCADE;
   ```
4. **Don't re-deploy until issue fixed**
5. **Fix the migration file** in this repository
6. **Test in local environment first** (create test Supabase project)
7. **Re-deploy only the fixed migration**

---

## CRITICAL SUCCESS FACTORS

### For Cart Operations
- ✅ Session tokens stored in localStorage persist across refreshes
- ✅ Guest carts are isolated (one per session token)
- ✅ Auth users get their own cart via Supabase.auth.uid()
- ✅ Totals always calculated server-side (not in frontend)

### For Build Operations
- ✅ Each component type can have only 1 product per build
- ✅ Validation runs server-side, not frontend
- ✅ Incomplete builds can still be added to cart
- ✅ Recalculation happens on every component change

### For Quote Operations
- ✅ Same idempotency_key always returns the same quote (CRITICAL)
- ✅ Different keys create different quotes
- ✅ Quote items are snapshot (not live references)
- ✅ WhatsApp click timestamp is immutable once set

### For Security (RLS)
- ✅ Guest carts filtered by session_token
- ✅ Auth carts filtered by auth.uid()
- ✅ RLS policies enforce at database level
- ✅ No data leakage between sessions

---

## MONITORING AFTER DEPLOYMENT

### Daily Checks
```sql
-- Check for errors in RPC execution
SELECT * FROM pg_stat_user_functions 
ORDER BY calls DESC;

-- Monitor quote idempotency
SELECT idempotency_key, COUNT(*) as count 
FROM quotes 
GROUP BY idempotency_key 
HAVING COUNT(*) > 1;  -- Should return 0 rows
```

### Logging
- Monitor browser console for `[CART ERROR]`, `[BUILD ERROR]`, `[QUOTE ERROR]` tags
- Check Supabase function logs in Dashboard → Logs
- Monitor Vercel/deployment logs for API errors

### Performance
- Cart operations should consistently <500ms
- Quote creation with idempotency check should be <1000ms
- Build validation should be <500ms for 8 components

---

## SUPPORT

If validation fails:
1. Check RPC_VALIDATION_REPORT.md for syntax verification
2. Verify all migrations deployed in Supabase Dashboard
3. Run SQL tests to isolate the issue
4. Check browser console (Ctrl+Shift+I) for error details
5. Verify at least one product exists in database

---

**STATUS**: Ready for deployment  
**LAST UPDATED**: 2026-04-05  
**TOTAL RPC FUNCTIONS**: 15  
**TOTAL TEST CASES**: 21 (10 SQL + 11 Frontend)
