# QUICK START: DEPLOYMENT CHECKLIST

## 🚀 READY TO DEPLOY

All code is complete. Use this checklist to deploy and validate.

---

## PHASE 1: SUPABASE DEPLOYMENT (15 min)

### ✅ Database Migrations
```bash
# Deploy in order via Supabase Dashboard → SQL Editor
1. Migration 012 (Cart RPC)        → backend/supabase/migrations/012_*.sql
2. Migration 013 (Product RPC)      → backend/supabase/migrations/013_*.sql
3. Migration 014 (Build RPC)        → backend/supabase/migrations/014_*.sql
4. Migration 015 (Quote RPC)        → backend/supabase/migrations/015_*.sql
```

**Expected Result**: 15 RPC functions created (verify in Supabase Dashboard → Functions)

---

## PHASE 2: SQL VALIDATION (5 min)

### ✅ Test Database Functions
```bash
# In Supabase Dashboard → SQL Editor
Copy: RPC_RUNTIME_TESTS.sql
Paste & Run
Expected: All 10 tests pass
```

| Test | Validates |
|------|-----------|
| 1 | Cart creation |
| 2 | Product add |
| 3 | Duplicate detection |
| 4 | Build creation |
| 5 | Component upsert |
| 6 | Build validation |
| 7 | Quote idempotency |
| 8 | Quote retrieval |
| 9 | WhatsApp tracking |
| 10 | Total recalculation |

---

## PHASE 3: FRONTEND TESTS (3 min)

### ✅ TypeScript Integration Tests
```bash
cd frontend
npm install vitest
npx vitest run RPC_RUNTIME_TESTS.ts
```

**Expected Result**: All 11 tests PASS ✓

---

## PHASE 4: MANUAL END-TO-END (10 min each)

### ✅ Test Scenario 1: Guest Cart
- Add product → Refresh → Still in cart ✓
- Add same product → Qty increases ✓
- Delete → Total = 0 ✓

### ✅ Test Scenario 2: Build Creation
- Create build → Get unique code ✓
- Add components → Total updates ✓
- Validate → Shows missing items ✓

### ✅ Test Scenario 3: Quote + Idempotency
- Create quote → Get code ✓
- Create another (same cart) → Same code ✓ (CRITICAL)
- Track WhatsApp → Timestamp persists ✓

### ✅ Test Scenario 4: RLS Security
- Session A: Add to cart
- Session B: Can't access ✓

---

## PHASE 5: VALIDATION SUMMARY

**If ALL tests pass:**
```
✅ 4 migrations deployed
✅ 10 SQL tests pass
✅ 11 frontend tests pass
✅ 4 manual scenarios work
✅ 0 console errors
✅ RLS policies enforced
```

**→ SYSTEM READY FOR PRODUCTION**

---

## 🛟 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| "Function not found" | Redeploy migrations in order |
| SQL test fails | Check product exists in database |
| Frontend test fails | Verify migrations deployed first |
| 500 errors in browser | Check Supabase logs → Functions |
| Total calculates wrong | Verify product prices in DB |
| Idempotency broken | Check quote_idempotency_key constraint |
| RLS blocks all access | Verify RLS policies deployed (migration 011) |

---

## 📊 REFERENCE

**Total RPC Functions**: 15
- Cart: 5 (get_or_create, get_with_items, add, remove, update_qty)
- Product: 2 (create, update)
- Build: 5 (create_or_get, get_with_items, upsert_item, delete_item, validate)
- Quote: 3 (create, track_click, get_with_items)

**Test Coverage**: 21 tests
- SQL: 10 (direct database)
- Frontend: 11 (integration)

**Estimated Runtime**: ~30 minutes total
- Deployment: 15 min
- SQL tests: 5 min
- Frontend tests: 3 min
- Manual testing: 10 min
- Validation: 2 min

---

## 📝 DOCUMENTATION

- **Full deployment guide**: [RPC_DEPLOYMENT_GUIDE.md](RPC_DEPLOYMENT_GUIDE.md)
- **Validation report**: [RPC_VALIDATION_REPORT.md](RPC_VALIDATION_REPORT.md)
- **SQL tests**: [RPC_RUNTIME_TESTS.sql](RPC_RUNTIME_TESTS.sql)
- **Frontend tests**: [RPC_RUNTIME_TESTS.ts](RPC_RUNTIME_TESTS.ts)

---

**Status**: ✅ Code complete, ready for deployment  
**Last updated**: 2026-04-05  
**Branch**: All changes in working tree
