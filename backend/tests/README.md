# Backend Tests

SQL-based tests for RPC functions and database functionality.

## Files

### RPC_RUNTIME_TESTS.sql
Comprehensive SQL test suite that validates all 15 RPC functions.

**Test Coverage:**
- 10 test cases covering all 4 RPC migrations
- Direct PostgreSQL execution
- Tests cart operations, product management, builds, and quotes
- Includes idempotency verification

**How to Run:**
1. Go to Supabase Dashboard → SQL Editor
2. Create a New Query
3. Copy entire content from this file
4. Click Run
5. Expected: All 10 tests output "TEST PASSED"

**Test Details:**
| # | Test | Function(s) Tested |
|---|------|-------------------|
| 1 | Cart creation | `get_or_create_customer_cart` |
| 2 | Add item | `add_item_to_cart` |
| 3 | Duplicate detection | `add_item_to_cart` (qty merge) |
| 4 | Build creation | `create_or_get_custom_build` |
| 5 | Component upsert | `upsert_custom_build_item` |
| 6 | Build validation | `validate_custom_build` |
| 7 | Idempotency | `create_quote_from_cart` |
| 8 | Quote retrieval | `get_quote_with_items` |
| 9 | WhatsApp tracking | `track_quote_whatsapp_click` |
| 10 | Totals recalculation | Multiple RPCs in sequence |

### VERIFY_RPC_FUNCTIONS.sql
Quick verification query to check status of all 15 RPC functions.

**How to Run:**
1. Go to Supabase Dashboard → SQL Editor
2. Create a New Query
3. Copy this file
4. Click Run
5. Expected: 15 functions should exist

**What It Checks:**
- Total count of expected RPC functions
- Per-function existence status (✅ or ❌)
- Migration history table status
- Core table existence

**Use Cases:**
- Verify deployments were successful
- Diagnose missing functions
- Check migration history alignment

## Prerequisites for Running Tests

### Database State
- ✅ Migrations 012-015 deployed (`npx supabase migration list` shows all)
- ✅ At least 1 product in `products` table (any type)
- ✅ At least 1 component-type product for build tests

### Supabase Project
- ✅ Valid Supabase URL and API keys
- ✅ RLS policies enabled
- ✅ Read access to `schema_migrations` table

## Expected Results

### Successful SQL Test Run
```
TEST PASSED: Created cart [uuid] for session [uuid]
TEST PASSED: Added item to cart, total: 50000
TEST PASSED: Duplicate detection works, items: 1
TEST PASSED: Created build [uuid] with code [CODE-ABC]
TEST PASSED: Added CPU component, total: 250000
TEST PASSED: Validation detected missing: [motherboard, ram, storage, psu]
TEST PASSED: Idempotency works, created quote [CODE-QT] once
TEST PASSED: Retrieved quote [CODE-QT] with 1 items
TEST PASSED: WhatsApp click tracked at 2026-04-06T12:00:00.000Z
TEST PASSED: Totals recalculated correctly: 50000 -> 250000 -> 75000

✓ All SQL RPC tests completed successfully!
```

### Successful Verification Run
```
total_rpc_count: 15

FUNCTION NAME                         STATUS
create_or_get_custom_build           EXISTS
create_product_with_specs            EXISTS
create_quote_from_cart               EXISTS
delete_custom_build_item             EXISTS
get_cart_with_items                  EXISTS
get_custom_build_with_items          EXISTS
get_or_create_customer_cart          EXISTS
get_quote_with_items                 EXISTS
remove_item_from_cart                EXISTS
track_quote_whatsapp_click           EXISTS
update_cart_item_quantity            EXISTS
update_product_with_specs            EXISTS
upsert_custom_build_item             EXISTS
validate_custom_build                EXISTS
add_item_to_cart                     EXISTS
```

## Troubleshooting

### "Function not found" error
**Cause:** Migration 012-015 not deployed
**Fix:**
1. Check: `npx supabase migration list` (should show 012-015 as applied)
2. If missing: `npx supabase db push` in backend/ directory
3. Rerun test

### "No rows found" or empty results
**Cause:** Database state issue (missing products, tables, etc)
**Fix:**
1. Run: `VERIFY_RPC_FUNCTIONS.sql` to check table/function status
2. Add test data if needed:
   ```sql
   INSERT INTO products (id, name, price, product_type) 
   VALUES (gen_random_uuid(), 'Test Product', 50000, 'component');
   ```
3. Rerun test

### "Permission denied" errors
**Cause:** RLS policies blocking access
**Fix:**
1. Check: RLS policies in Supabase Dashboard
2. Verify: Session tokens are valid
3. Check: `session_token` and `customer_auth_id` values match

### Timeout or slow execution
**Cause:** Large dataset or slow database
**Fix:**
1. Check: Database performance (Supabase Dashboard → Logs)
2. Reduce: Test data size (delete old test records)
3. Run: At off-peak time if on shared instance

## Performance Expectations

| Operation | Target | Warning |
|-----------|--------|---------|
| Cart creation | 50ms | > 200ms |
| Add to cart | 100ms | > 300ms |
| Build creation | 75ms | > 200ms |
| Build validation | 50ms | > 150ms |
| Quote creation | 200ms | > 500ms |
| Complete test suite | ~2s | > 10s |

## Integration with CI/CD

To run these tests automatically in CI/CD:

```bash
#!/bin/bash
# Run SQL tests via Supabase CLI
cd backend
npx supabase db push --dry-run  # Verify no pending migrations
npx supabase migration list       # List applied migrations

# Run verification
# (SQL tests would need custom wrapper script as Supabase CLI doesn't directly support SQL test execution)
```

## Related Files

- **Frontend tests**: `frontend/RPC_RUNTIME_TESTS.ts` (TypeScript/Vitest)
- **RPC migrations**: `backend/supabase/migrations/012-015_*.sql`
- **Documentation**: `docs/rpc-deployment/`

## Test Lifecycle

```
Local Dev
    ↓
Create/Fix RPC migration (012-015)
    ↓
Push to Supabase (npx supabase db push)
    ↓
Run VERIFY_RPC_FUNCTIONS.sql (confirm deploy)
    ↓
Run RPC_RUNTIME_TESTS.sql (10 SQL tests)
    ↓
Run frontend RPC_RUNTIME_TESTS.ts (11 Vitest tests)
    ↓
Manual E2E testing (5 scenarios)
    ↓
✅ Ready for production
```

## Support

For issues:
1. Run `VERIFY_RPC_FUNCTIONS.sql` first
2. Check Supabase Dashboard → Logs → Functions
3. Review `docs/rpc-deployment/RPC_MONITORING_GUIDE.md`
4. Check migration files for syntax issues
