# PRODUCTION READINESS VERIFICATION REPORT

**Generated**: April 5, 2026  
**Status**: BLOCKED - Deployment In Progress  
**Last Update**: Attempting migration deployment to Supabase

---

## DEPLOYMENT STATUS

### Current Issue
```
Migration deployment partially failed:
- Migrations 002-015 were queued for push
- Migration 002 failed: "type 'product_type' already exists"
- This indicates migrations may already be partially applied
```

### Next Step
Check Supabase dashboard → SQL Editor to verify which migrations have already been applied.

---

## ✅ PRE-PRODUCTION CHECKLIST

### Requirement 1: All 4 migrations run cleanly in Supabase
```
Status: 🟡 PENDING VERIFICATION
└─ Migrations 012-015 should be in Supabase after successful push
└─ Run VERIFY_RPC_FUNCTIONS.sql in Supabase to confirm 15 functions exist
└─ Expected Result: 15 rows returned with all RPC function names
```

**Verification Script**: [VERIFY_RPC_FUNCTIONS.sql](VERIFY_RPC_FUNCTIONS.sql)

**How to Run**:
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy content from VERIFY_RPC_FUNCTIONS.sql
4. Run
5. Should see all 15 function names listed

**Expected Output**:
```
function_name
--------------------------------------
get_or_create_customer_cart
get_cart_with_items
add_item_to_cart
remove_item_from_cart
update_cart_item_quantity
create_product_with_specs
update_product_with_specs
create_or_get_custom_build
get_custom_build_with_items
upsert_custom_build_item
delete_custom_build_item
validate_custom_build
create_quote_from_cart
track_quote_whatsapp_click
get_quote_with_items

total_rpc_functions: 15
```

**If FAILED** (less than 15 functions):
- [ ] Redeploy missing migrations via Supabase SQL Editor
- [ ] Check `RPC_DEPLOYMENT_GUIDE.md` Phase 1 for steps

---

### Requirement 2: RPC_RUNTIME_TESTS.sql → 10/10 pass
```
Status: 🟡 READY TO TEST (after Requirement 1 passes)
└─ Run RPC_RUNTIME_TESTS.sql in Supabase
└─ Expected: All 10 tests output "TEST PASSED"
```

**How to Run**:
1. Go to Supabase Dashboard → SQL Editor
2. Create new query
3. Copy entire content from `RPC_RUNTIME_TESTS.sql`
4. Run
5. Monitor output panel for TEST PASSED messages

**Expected Output** (abbreviated):
```
✓ TEST PASSED: Created cart [uuid] for session [uuid]
✓ TEST PASSED: Added item to cart, total: [amount]
✓ TEST PASSED: Duplicate detection works, items: 1
✓ TEST PASSED: Created build [uuid] with code [code]
✓ TEST PASSED: Added CPU component, total: [amount]
✓ TEST PASSED: Validation detected missing: [...]
✓ TEST PASSED: Idempotency works, created quote [code] once
✓ TEST PASSED: Retrieved quote [code] with 1 items
✓ TEST PASSED: WhatsApp click tracked at [timestamp]
✓ TEST PASSED: Totals recalculated correctly

✓ All SQL RPC tests completed successfully!
```

**If ANY FAIL**:
- [ ] Check error message
- [ ] Run VERIFY_RPC_FUNCTIONS.sql to confirm functions exist
- [ ] Check RPC_MONITORING_GUIDE.md → "Error Patterns & Fixes"
- [ ] Fix migration and redeploy

---

### Requirement 3: RPC_RUNTIME_TESTS.ts → all pass
```
Status: 🟡 READY TO TEST (after Requirement 1 passes)
└─ Run Vitest suite on frontend
└─ Expected: All 11 tests PASS
```

**How to Run**:
```bash
cd frontend
npm install vitest     # if not already installed
npx vitest run RPC_RUNTIME_TESTS.ts
```

**Expected Output**:
```
✓ RPC Runtime Validation (11 tests)
  ✓ Cart Flow
    ✓ should create new cart via get_or_create_customer_cart
    ✓ should add product to cart
    ✓ should recalculate totals on quantity update
    ✓ should detect duplicate items and merge quantities
    ✓ should remove cart item
  ✓ Build Flow
    ✓ should create new custom build
    ✓ should add component to build
    ✓ should replace component when same type added
    ✓ should validate build and detect missing components
  ✓ Quote Flow
    ✓ should create quote from cart
    ✓ should enforce idempotency

PASS  RPC_RUNTIME_TESTS.ts (11 tests)
```

**If ANY FAIL**:
- [ ] Check error message - likely reason is Function Not Found
- [ ] Verify Requirement 1 passed (all 15 functions in Supabase)
- [ ] Check RPC_MONITORING_GUIDE.md → "Error Patterns & Fixes"

---

### Requirement 4: Manual scenarios → all pass
```
Status: 🟡 READY TO TEST (after Requirements 1-3 pass)
└─ 5 manual scenarios to verify via QA environment
└─ Each tests critical user flow
```

**Scenario 1: Guest Cart Persistence**
1. Open frontend in **private/incognito window** (no session)
2. Add product to cart
3. **Verify**: 
   - [ ] No errors in console
   - [ ] Product appears in cart UI
   - [ ] Total displayed correctly
4. Refresh page (F5)
5. **Verify**: 
   - [ ] Cart still contains product (session persisted)
   - [ ] Total still correct
6. Add another of same product
7. **Verify**:
   - [ ] Quantity changes from 1 → 2
   - [ ] Total doubles (not another row)
8. Delete item
9. **Verify**:
   - [ ] Item removed
   - [ ] Cart total = 0
   - [ ] No console errors

**Scenario 2: Custom Build Creation + Validation**
1. Go to **Builds** page
2. Click **Create New Build**
3. **Verify**: 
   - [ ] Build created with unique code
   - [ ] Form displays for adding components
4. Add **CPU** component
5. **Verify**:
   - [ ] Component price shown
   - [ ] Total updates (recalculated)
6. Click **Validate**
7. **Verify**: 
   - [ ] Shows missing: Motherboard, RAM, Storage, PSU
   - [ ] Does NOT show CPU as missing (was added)
8. Try to add to cart (without completing build)
9. **Verify**: 
   - [ ] Success (incomplete builds allowed)
   - [ ] No validation error

**Scenario 3: Quote Creation**
1. Add product to cart
2. Go to **Create Quote** 
3. Enter customer name "Test Customer"
4. Click **Create Quote**
5. **Verify**:
   - [ ] Quote code generated (e.g., "QT-2026-001")
   - [ ] Quote appears in list
   - [ ] Click tracking ready (WhatsApp button enabled)

**Scenario 4: Idempotency Test (CRITICAL)**
1. Do Scenario 3 steps 1-4
2. **Note the quote code** (e.g., "QT-2026-001")
3. Create quote AGAIN with same cart
4. **Verify**: 
   - [ ] SAME quote code returned (not new)
   - [ ] No duplicate quote in database
5. In Supabase, check:
   ```sql
   SELECT COUNT(*) FROM quotes 
   WHERE idempotency_key = [the key]
   -- Should return: 1
   ```

**Scenario 5: RLS Security**
1. **Window A** (Private/Incognito 1):
   - Add product to cart
   - Note: session token = UUID_A (in localStorage)
2. **Window B** (Private/Incognito 2):
   - Open frontend
   - Note: session token = UUID_B (different)
3. Try to access Window A's cart from Window B:
   - Modify URL to point to cart from Window A
   - **Verify**: 
     - [ ] Cannot access (RLS blocks)
     - [ ] Shows empty cart or error
4. Create quote in Window A
5. Try to view in Window B:
   - **Verify**: 
     - [ ] Cannot see it (RLS blocks)
     - [ ] Quote list empty or filtered

**Pass Criteria**: All 5 scenarios work without console errors

---

### Requirement 5: No RLS errors in frontend console
```
Status: 🟡 READY TO TEST (during manual scenarios)
└─ Monitor browser console during all tests
└─ No "error policy violation" messages
```

**How to Check**:
1. Open browser DevTools: `Ctrl+Shift+I` (Windows) or `Cmd+Option+I` (Mac)
2. Click **Console** tab
3. Run each manual scenario
4. **Verify**: No errors containing:
   - "error policy violation"
   - "permission denied"
   - "row-level security policy"
5. Only expected errors:
   - "Function not found" → Fix by redeploying migrations
   - "No rows" → Expected for pagination

**If RLS errors found**:
- [ ] Check RPC_MONITORING_GUIDE.md → "Pattern 2: RLS Policy Blocks Legitimate Access"
- [ ] Verify session_token is being sent with every RPC call
- [ ] Check RLS policies in Supabase: Dashboard → SQL Editor → Run VERIFY_RPC_FUNCTIONS.sql

---

### Requirement 6: No unexpected null/undefined data in UI
```
Status: 🟡 READY TO TEST (during manual scenarios)
└─ Monitor UI for missing data during all flows
└─ All prices, totals, names should display
```

**What to Check**:
- [ ] Cart total: Always shows a number (never blank)
- [ ] Cart items: All show price, quantity, subtotal
- [ ] Build total: Updates when components added
- [ ] Quote code: Generated and displayed (never blank)
- [ ] Quote customer name: Shows correctly in list
- [ ] WhatsApp timestamp: Shows after click

**If data missing**:
- [ ] Check API response in Network tab
- [ ] Look for console errors about null values
- [ ] Run the matching SQL test to isolate issue

---

### Requirement 7: Quote idempotency holds under repeated calls
```
Status: 🟡 READY TO BUILD TEST
└─ Create automated test for repeated quote creation
└─ Same input → Same output (same quote_code)
```

**Build Test Procedure** (if not automated):
1. Create cart and product
2. Create quote 3 times in rapid succession
3. **Verify**:
   - [ ] All 3 return same quote_code
   - [ ] All 3 return same quote_id
   - [ ] Database has only 1 quote record
4. Create quote from different cart
5. **Verify**:
   - [ ] Different quote_code generated
   - [ ] Not flagged as duplicate

**Automated Test** (already in RPC_RUNTIME_TESTS.ts):
```bash
npx vitest run RPC_RUNTIME_TESTS.ts -t "idempotency"
# Should PASS
```

**Verification Query**:
```sql
-- Run in Supabase to confirm idempotency working
SELECT 
  idempotency_key,
  COUNT(*) as quote_count,
  COUNT(DISTINCT id) as unique_quote_ids
FROM quotes
WHERE idempotency_key IS NOT NULL
GROUP BY idempotency_key
HAVING COUNT(*) > 1;
-- Should return: 0 rows (no duplicates)
```

---

### Requirement 8: Totals always correct after mutations
```
Status: 🟡 READY TO BUILD TEST
└─ Verify totals recalculate on every add/update/delete
└─ Verify formula: SUM(item.price * item.qty) = cart.total
```

**Manual Test Procedure**:
1. Create cart and add Product A ($100)
   - Total should = $100
2. Add 2 more of Product A
   - Total should = $300 (qty = 3)
3. Update qty to 1
   - Total should = $100
4. Add Product B ($50)
   - Total should = $150
5. Delete Product A
   - Total should = $50
6. Delete Product B
   - Total should = $0

**Pass Criteria**: Total matches formula at every step

**Automated Test** (already in RPC_RUNTIME_TESTS.ts):
```bash
npx vitest run RPC_RUNTIME_TESTS.ts -t "totals"
# Should PASS
```

**Verification Query**:
```sql
-- Run in Supabase to verify total calculations
SELECT 
  c.id as cart_id,
  c.total_price as cart_total,
  (SELECT COALESCE(SUM(price * quantity), 0) 
   FROM cart_items WHERE cart_id = c.id) as calculated_total,
  CASE 
    WHEN c.total_price = (SELECT COALESCE(SUM(price * quantity), 0) FROM cart_items WHERE cart_id = c.id)
    THEN 'CORRECT'
    ELSE 'MISMATCH'
  END as status
FROM carts c
ORDER BY c.created_at DESC
LIMIT 20;
```

---

## OVERALL PRODUCTION READINESS SUMMARY

```
┌─ REQUIREMENT 1: 4 Migrations Deployed ─────────────────┐
│ Status: 🟡 PENDING                                       │
│ Action: Verify in Supabase, redeploy if needed          │
│ Blocker: Yes (must pass before any tests)                │
└──────────────────────────────────────────────────────────┘

┌─ REQUIREMENT 2: SQL Tests 10/10 Pass ──────────────────┐
│ Status: 🟡 READY (after R1)                              │
│ Action: Run RPC_RUNTIME_TESTS.sql in Supabase            │
│ Expected: 10 TEST PASSED messages                        │
│ Blocker: Yes (if any fail, fix must be RPC-level)        │
└──────────────────────────────────────────────────────────┘

┌─ REQUIREMENT 3: Frontend Tests All Pass ───────────────┐
│ Status: 🟡 READY (after R1)                              │
│ Action: Run vitest in frontend/                          │
│ Expected: 11/11 tests PASS                               │
│ Blocker: Yes (if any fail, check R1 first)               │
└──────────────────────────────────────────────────────────┘

┌─ REQUIREMENT 4: Manual Scenarios All Pass ─────────────┐
│ Status: 🟡 READY (after R1-R3)                           │
│ Action: Manual QA of 5 scenarios                         │
│ Expected: All flows work, no console errors              │
│ Blocker: Yes (catches UI-level issues)                   │
└──────────────────────────────────────────────────────────┘

┌─ REQUIREMENT 5: No RLS Errors in Console ──────────────┐
│ Status: 🟡 READY (monitor during R4)                     │
│ Action: Check DevTools Console during tests              │
│ Expected: No "error policy violation" messages           │
│ Blocker: Yes (RLS is security-critical)                  │
└──────────────────────────────────────────────────────────┘

┌─ REQUIREMENT 6: No null/undefined Data in UI ──────────┐
│ Status: 🟡 READY (monitor during R4)                     │
│ Action: Verify all prices/totals/names display           │
│ Expected: All required fields populated                  │
│ Blocker: Yes (data integrity check)                      │
└──────────────────────────────────────────────────────────┘

┌─ REQUIREMENT 7: Quote Idempotency Holds ───────────────┐
│ Status: 🟡 READY (covered in R3)                         │
│ Action: Run idempotency test from RPC_RUNTIME_TESTS.ts   │
│ Expected: Same key = same quote (tested automated)       │
│ Blocker: Yes (idempotency is critical for reliability)   │
└──────────────────────────────────────────────────────────┘

┌─ REQUIREMENT 8: Totals Always Correct ─────────────────┐
│ Status: 🟡 READY (covered in R3 + manual)                │
│ Action: Run total tests (automated) + verify manually    │
│ Expected: SUM(price*qty) = total at every step           │
│ Blocker: Yes (correctness-critical)                      │
└──────────────────────────────────────────────────────────┘
```

---

## EXECUTION ORDER

**DO NOT SKIP STEPS - Each blocks the next**

1. **RIGHT NOW**: 
   - [ ] Run VERIFY_RPC_FUNCTIONS.sql in Supabase
   - [ ] Confirm 15 functions exist
   - **STOP if < 15** → Redeploy migrations

2. **THEN** (after confirming 15 functions):
   - [ ] Run RPC_RUNTIME_TESTS.sql in Supabase
   - **STOP if any fail** → Diagnose & fix RPC

3. **THEN** (after R1 & R2 pass):
   - [ ] Run RPC_RUNTIME_TESTS.ts in frontend
   - **STOP if any fail** → Diagnose & fix integration

4. **THEN** (after R1-R3 pass):
   - [ ] Run 5 manual scenarios in browser
   - [ ] Monitor console for errors
   - [ ] Verify data displays correctly

5. **THEN** (after all 4 pass):
   - [ ] Run idempotency verification query
   - [ ] Run totals verification query

6. **THEN** (if all pass):
   - [ ] ✅ **READY FOR PRODUCTION**
   - [ ] Deploy frontend to Vercel
   - [ ] Monitor for 24 hours before full release

---

## ROLLBACK PLAN

If any requirement fails at production:

1. **Identify failure**: Check which requirement failed
2. **Check logs**: 
   - Supabase: Dashboard → Logs → Functions
   - Frontend: Browser console (Ctrl+Shift+I)
3. **Diagnose**: See RPC_MONITORING_GUIDE.md
4. **Fix**: Deploy corrected migration or frontend code
5. **Re-test**: Run same test again
6. **Monitor**: Watch error rate for 1 hour

**Emergency Rollback**: If system breaking:
```sql
-- Disable RPC layer, fall back to REST API
-- (requires restored Express backend)
DROP FUNCTION IF EXISTS public.get_or_create_customer_cart(...) CASCADE;
-- ... etc for all 15 functions
```

---

## CHECKPOINT SIGN-OFF

| ✅ | Requirement | Owner | Status | Date |
|----|-------------|-------|--------|------|
| 1 | 15 RPC Functions Deployed | DevOps | ⏳ | _ |
| 2 | RPC_RUNTIME_TESTS.sql 10/10 | QA | ⏳ | _ |
| 3 | RPC_RUNTIME_TESTS.ts All Pass | QA | ⏳ | _ |
| 4 | Manual Scenarios All Pass | QA | ⏳ | _ |
| 5 | No RLS Errors | QA | ⏳ | _ |
| 6 | No null/undefined Data | QA | ⏳ | _ |
| 7 | Idempotency Verified | QA | ⏳ | _ |
| 8 | Totals Correctness Verified | QA | ⏳ | _ |

---

**PRODUCTION READY**: Only after ALL 8 requirements checked ✅

**Current Status**: 🟡 BLOCKED ON REQUIREMENT 1  
**Next Action**: Run VERIFY_RPC_FUNCTIONS.sql in Supabase
