# RPC Deployment & Testing Documentation

This directory contains all documentation related to RPC deployment, testing, and monitoring.

## Files

### 📋 RPC_DEPLOYMENT_GUIDE.md
Complete step-by-step guide for deploying RPC migrations and running all validation tests.

**Sections:**
- Phase 1: Migration Deployment
- Phase 2: SQL Functional Testing
- Phase 3: Frontend Integration Testing
- Phase 4: Manual End-to-End Testing
- Phase 5: Validation Checklist

**When to use:** First-time deployment or complete refresh

### 🔍 RPC_MONITORING_GUIDE.md
Production monitoring, troubleshooting guide, and ongoing health checks.

**Sections:**
- Deployment Status Tracking
- Live Monitoring Queries
- Error Patterns & Fixes (6 common issues)
- Performance Monitoring
- Data Integrity Checks
- Rollback Procedures
- Monitoring Dashboard

**When to use:** Post-deployment monitoring, troubleshooting issues, setting up alerts

### ✅ RPC_VALIDATION_REPORT.md
Static validation report confirming RPC signatures match between migrations and frontend code.

**Contains:**
- RPC function inventory
- Parameter mapping verification
- Return type compatibility
- TypeScript validation results

**When to use:** Review before deployment to catch signature mismatches

## Quick Access

### 🚀 First Time Deployment?
1. Read: `RPC_DEPLOYMENT_GUIDE.md` - PHASE 1 & PHASE 2
2. Run: Tests from Phase 2 and Phase 3
3. Execute: Manual tests from Phase 4

### 🐛 Troubleshooting Issues?
1. Check: `RPC_MONITORING_GUIDE.md` - "Error Patterns & Fixes"
2. Run: Diagnostic queries
3. Fix: Apply the suggested solution
4. Test: Re-run the relevant test

### ⚠️ Something Breaking?
1. Check: `RPC_MONITORING_GUIDE.md` - "Rollback Procedures"
2. Execute: Rollback commands
3. Fix: Update migration files
4. Redeploy: Only the fixed migration

## Related Files

- **Frontend Tests**: `frontend/RPC_RUNTIME_TESTS.ts` - Run with `npx vitest run`
- **SQL Tests**: `backend/tests/RPC_RUNTIME_TESTS.sql` - Run in Supabase SQL Editor
- **Verification Queries**: `backend/tests/VERIFY_RPC_FUNCTIONS.sql` - Check function status
- **Migration Files**: `backend/supabase/migrations/012-015_*.sql` - RPC definitions

## Test Coverage Summary

| Test Suite | Location | Tests | Purpose |
|-----------|----------|-------|---------|
| SQL Tests | `backend/tests/RPC_RUNTIME_TESTS.sql` | 10 | Direct RPC validation |
| Frontend Tests | `frontend/RPC_RUNTIME_TESTS.ts` | 11 | Integration with Supabase client |
| Manual Tests | `RPC_DEPLOYMENT_GUIDE.md` Phase 4 | 5 scenarios | End-to-end user flows |

**Total Coverage**: 26 test cases across SQL, TypeScript, and manual scenarios

## 15 RPC Functions Deployed

### Cart Management (5)
- `get_or_create_customer_cart`
- `get_cart_with_items`
- `add_item_to_cart`
- `remove_item_from_cart`
- `update_cart_item_quantity`

### Product Creation (2)
- `create_product_with_specs`
- `update_product_with_specs`

### Build Management (5)
- `create_or_get_custom_build`
- `get_custom_build_with_items`
- `upsert_custom_build_item`
- `delete_custom_build_item`
- `validate_custom_build`

### Quote Creation (3)
- `create_quote_from_cart`
- `track_quote_whatsapp_click`
- `get_quote_with_items`

## Migration Files (Deployed)

- `migration/012_create_cart_management_rpc.sql` - 5 cart functions
- `migration/013_create_product_creation_rpc.sql` - 2 product functions
- `migration/014_create_build_management_rpc.sql` - 5 build functions
- `migration/015_create_quote_creation_rpc.sql` - 3 quote functions

**Status**: ✅ All deployed and verified (15/15 functions exist)

## Key Concepts

### Idempotency
Quote creation uses idempotency keys to prevent duplicates. Same key = same quote, always.

### RLS (Row Level Security)
- Guest carts isolated by `session_token`
- Auth carts isolated by `auth.uid()`
- Prevents cross-user data access

### Totals Calculation
All totals calculated server-side in RPC functions, never in frontend.

### Session Management
- Guest: `localStorage['ys-guest-session']` (UUID)
- Auth: `supabase.auth.user.id`

## Support

For issues not covered in the guides:
1. Check browser console for error messages
2. Run verification query: `backend/tests/VERIFY_RPC_FUNCTIONS.sql`
3. Check Supabase logs: Dashboard → Logs → Functions
4. Review `RPC_MONITORING_GUIDE.md` troubleshooting section
