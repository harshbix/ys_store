# RPC SYSTEM MONITORING & TROUBLESHOOTING

## DEPLOYMENT STATUS TRACKING

### Before Deployment
- [ ] All 4 migration files exist in `backend/supabase/migrations/`
- [ ] All API files migrated to RPC (cart.ts, builds.ts, quotes.ts)
- [ ] TypeScript compilation: 0 errors
- [ ] Test files created: RPC_RUNTIME_TESTS.sql and .ts

### Deployment Window
```timeline
T+00:00 - Deploy migration 012 (cart RPC)
T+00:05 - Deploy migration 013 (product RPC)
T+00:10 - Deploy migration 014 (build RPC)
T+00:15 - Deploy migration 015 (quote RPC)
T+00:20 - Run SQL tests
T+00:25 - Run frontend tests
T+00:30 - Manual validation begins
```

### Post-Deployment
- [ ] All 15 functions visible in Supabase Dashboard → Functions
- [ ] No RPC function errors in Supabase logs
- [ ] Frontend loads without API errors
- [ ] Cart operations work end-to-end

---

## LIVE MONITORING QUERIES

### Monitor Cart Operations
```sql
-- Check cart creation rate
SELECT DATE_TRUNC('minute', created_at) as time,
       COUNT(*) as carts_created,
       COUNT(DISTINCT session_token) as unique_sessions
FROM carts
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY 1 ORDER BY 1 DESC;

-- Find problematic cart states
SELECT id, session_token, items_count, total_price, created_at
FROM carts
WHERE items_count > 100  -- Suspicious
   OR total_price IS NULL  -- Error state
   OR updated_at < created_at  -- Data consistency
ORDER BY created_at DESC;
```

### Monitor Quote Operations
```sql
-- Verify idempotency is working
SELECT idempotency_key, COUNT(*) as count, 
       ARRAY_AGG(id) as quote_ids
FROM quotes
WHERE idempotency_key IS NOT NULL
GROUP BY idempotency_key
HAVING COUNT(*) > 1;  -- Should return 0 rows

-- Check quote creation volume
SELECT DATE_TRUNC('hour', created_at) as time,
       COUNT(*) as quotes_created,
       AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_process_time_sec
FROM quotes
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY 1 ORDER BY 1 DESC;

-- Find abandonded quotes (not converted to orders)
SELECT id, quote_code, created_at, customer_name
FROM quotes
WHERE created_at < NOW() - INTERVAL '7 days'
  AND status = 'draft'
ORDER BY created_at DESC
LIMIT 20;
```

### Monitor Build Operations
```sql
-- Track incomplete build validation
SELECT 
  COUNT(*) as total_builds,
  COUNT(CASE WHEN validated = true THEN 1 END) as complete,
  COUNT(CASE WHEN validated = false THEN 1 END) as incomplete
FROM custom_builds;

-- Find slow builds (too many components)
SELECT id, build_code, COUNT(*) as item_count, total_price
FROM custom_builds cb
JOIN custom_build_items cbi ON cb.id = cbi.build_id
GROUP BY cb.id
HAVING COUNT(*) > 20  -- Warning threshold
ORDER BY COUNT(*) DESC;
```

---

## ERROR PATTERNS & FIXES

### Pattern 1: "Function not found" Error

**Symptom**: Browser console shows `PostgreSQL: function get_or_create_customer_cart(...) does not exist`

**Root Cause**: Migration not deployed

**Fix**:
1. Go to Supabase Dashboard → SQL Editor
2. Create new query tab
3. Copy the migration file content
4. Execute
5. Verify in Functions list

**Verification**:
```sql
SELECT proname, pronargs 
FROM pg_proc 
WHERE proname LIKE '%cart%' 
ORDER BY proname;
-- Should return 5 rows
```

---

### Pattern 2: RLS Policy Blocks Legitimate Access

**Symptom**: Frontend gets 200 OK but empty data: `select: error policy violation`

**Root Cause**: RLS policies too restrictive OR session token not being sent correctly

**Diagnostic Steps**:
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'carts';

-- Check what policies exist
SELECT schemaname, tablename, policyname, permissive, qual
FROM pg_policies
WHERE tablename IN ('carts', 'quotes', 'custom_builds')
ORDER BY tablename, policyname;
```

**Fix**:
1. Verify session_token is being stored in frontend localStorage
2. Verify session_token is being sent in RPC calls:
   ```typescript
   // Frontend should be doing this
   const sessionToken = localStorage.getItem('session_token');
   const result = await supabase.rpc('get_cart_with_items', {
     p_session_token: sessionToken  // MUST be passed
   });
   ```
3. If policies block, check RLS column values in database:
   ```sql
   SELECT id, session_token, auth_user_id, created_at
   FROM carts
   WHERE session_token = 'YOUR_SESSION_TOKEN_HERE'
   LIMIT 1;
   ```

---

### Pattern 3: Idempotency Not Working

**Symptom**: Same idempotency_key creates multiple quotes

**Root Cause**: Migration 015 not deployed OR unique constraint index failed

**Verification**:
```sql
-- Check if constraint exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'quotes'
  AND constraint_type = 'UNIQUE';

-- Check index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'quotes'
  AND indexname ILIKE '%idempotency%';
```

**Fix**:
```sql
-- If missing, create constraint manually
ALTER TABLE quotes
ADD CONSTRAINT quotes_idempotency_key_unique 
UNIQUE (idempotency_key);

-- If index missing, create it
CREATE UNIQUE INDEX idx_quotes_idempotency_key 
ON quotes(idempotency_key) 
WHERE idempotency_key IS NOT NULL;
```

---

### Pattern 4: Totals Not Recalculating

**Symptom**: Change cart item qty, total stays same

**Root Cause**: RPC function not executing OR price lookup failing

**Check**:
```sql
-- Verify function logic
SELECT pg_get_functiondef(
  'public.update_cart_item_quantity(uuid, uuid, bigint, uuid, text)'::regprocedure
);

-- Check if product prices are in database
SELECT id, name, price FROM products LIMIT 5;
-- If empty, add test products first
```

**Fix**: Re-run migration 012 manually after confirming products exist

---

### Pattern 5: Guest Session Not Persisting

**Symptom**: Refresh page, cart is empty (session token lost)

**Root Cause**: localStorage is cleared OR session_token generation code missing

**Frontend Fix**:
```typescript
// In app initialization, ensure this runs:
let sessionToken = localStorage.getItem('guest_session_token');
if (!sessionToken) {
  sessionToken = crypto.randomUUID();
  localStorage.setItem('guest_session_token', sessionToken);
}
// Store for RPC calls
window.guestSessionToken = sessionToken;
```

**Verification**:
```javascript
// In browser console
console.log(localStorage.getItem('guest_session_token'));
// Should output a UUID, not null
```

---

### Pattern 6: WhatsApp Click Tracking Not Persisting

**Symptom**: tracked_whatsapp_click_at stays NULL

**Root Cause**: track_quote_whatsapp_click() not being called

**Check**:
```sql
-- Are any clicks being tracked?
SELECT id, tracked_whatsapp_click_at, created_at
FROM quotes
WHERE tracked_whatsapp_click_at IS NOT NULL
ORDER BY tracked_whatsapp_click_at DESC;
```

**Frontend Fix**: Ensure this is called when WhatsApp link clicked:
```typescript
await supabase.rpc('track_quote_whatsapp_click', {
  p_quote_id: quoteId
});
```

---

## PERFORMANCE MONITORING

### Expected Response Times
| Operation | Target | Threshold |
|-----------|--------|-----------|
| get_or_create_customer_cart | 50ms | 200ms |
| add_item_to_cart | 100ms | 300ms |
| update_cart_item_quantity | 75ms | 250ms |
| create_custom_build | 75ms | 200ms |
| validate_custom_build | 50ms | 150ms |
| create_quote_from_cart | 200ms | 500ms |
| get_quote_with_items | 75ms | 200ms |

### Monitor Function Performance
```sql
-- Check function execution stats
SELECT 
  schemaname,
  funcname,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_user_functions
WHERE schemaname = 'public'
  AND funcname ILIKE '%cart%' 
     OR funcname ILIKE '%quote%'
     OR funcname ILIKE '%build%'
  OR funcname ILIKE '%product%'
ORDER BY mean_time DESC;
```

### Setup Performance Alerts
```sql
-- Create function to log slow queries
CREATE OR REPLACE FUNCTION public.log_slow_rpc_calls()
RETURNS VOID AS $$
BEGIN
  -- Log queries taking >500ms to analytics table
  INSERT INTO rpc_performance_log (funcname, execution_time_ms, logged_at)
  SELECT 
    funcname,
    EXTRACT(EPOCH FROM mean_time) * 1000,
    NOW()
  FROM pg_stat_user_functions
  WHERE EXTRACT(EPOCH FROM mean_time) * 1000 > 500;
END;
$$ LANGUAGE plpgsql;

-- Schedule to run every 5 minutes
-- (Requires pg_cron extension or external scheduler)
```

---

## DATA INTEGRITY CHECKS

### Daily Integrity Audit
```sql
-- Run daily to verify system health
DO $$
DECLARE
  v_errors TEXT := '';
BEGIN
  -- Check 1: Orphaned cart items (cart deleted but items exist)
  IF EXISTS (SELECT 1 FROM cart_items ci 
             WHERE NOT EXISTS (SELECT 1 FROM carts WHERE id = ci.cart_id)) THEN
    v_errors := v_errors || E'\n❌ Found orphaned cart items';
  END IF;

  -- Check 2: Negative totals
  IF EXISTS (SELECT 1 FROM carts WHERE total_price < 0) THEN
    v_errors := v_errors || E'\n❌ Found negative cart totals';
  END IF;

  -- Check 3: Duplicate quotes with same idempotency key
  IF EXISTS (SELECT idempotency_key FROM quotes 
             WHERE idempotency_key IS NOT NULL
             GROUP BY idempotency_key HAVING COUNT(*) > 1) THEN
    v_errors := v_errors || E'\n❌ Found duplicate quotes with same idempotency key';
  END IF;

  -- Check 4: Incomplete builds marked as complete
  IF EXISTS (SELECT 1 FROM custom_builds 
             WHERE validated = true 
             AND NOT EXISTS (
               SELECT 1 FROM custom_build_items cbi
               WHERE cbi.build_id = custom_builds.id
               AND cbi.product_type IN ('cpu', 'motherboard', 'ram', 'storage', 'psu')
             )) THEN
    v_errors := v_errors || E'\n❌ Found invalid complete builds';
  END IF;

  IF v_errors = '' THEN
    RAISE NOTICE '✅ All integrity checks passed';
  ELSE
    RAISE WARNING 'Data integrity issues found:%s', v_errors;
  END IF;
END $$;
```

---

## ROLLBACK PROCEDURES

### Rollback Single RPC Function
```sql
-- If a specific function has bugs
DROP FUNCTION public.function_name(param_types) CASCADE;

-- Then redeploy just that migration after fixing
```

### Rollback All RPC Migrations
```sql
-- Only if system is broken, in order (reverse):
DROP FUNCTION IF EXISTS public.create_quote_from_cart(...) CASCADE;
DROP FUNCTION IF EXISTS public.track_quote_whatsapp_click(...) CASCADE;
DROP FUNCTION IF EXISTS public.get_quote_with_items(...) CASCADE;

DROP FUNCTION IF EXISTS public.create_or_get_custom_build(...) CASCADE;
DROP FUNCTION IF EXISTS public.get_custom_build_with_items(...) CASCADE;
DROP FUNCTION IF EXISTS public.upsert_custom_build_item(...) CASCADE;
DROP FUNCTION IF EXISTS public.delete_custom_build_item(...) CASCADE;
DROP FUNCTION IF EXISTS public.validate_custom_build(...) CASCADE;

DROP FUNCTION IF EXISTS public.create_product_with_specs(...) CASCADE;
DROP FUNCTION IF EXISTS public.update_product_with_specs(...) CASCADE;

DROP FUNCTION IF EXISTS public.get_or_create_customer_cart(...) CASCADE;
DROP FUNCTION IF EXISTS public.get_cart_with_items(...) CASCADE;
DROP FUNCTION IF EXISTS public.add_item_to_cart(...) CASCADE;
DROP FUNCTION IF EXISTS public.remove_item_from_cart(...) CASCADE;
DROP FUNCTION IF EXISTS public.update_cart_item_quantity(...) CASCADE;

-- Then backend API must be restored to handle requests
```

---

## MONITORING DASHBOARD (Queries to Run Weekly)

```sql
-- WEEKLY SYSTEM HEALTH REPORT
SELECT '=== YS STORE RPC SYSTEM HEALTH ===' as report;

-- 1. RPC Function Status
SELECT COUNT(*) as total_functions,
       COUNT(CASE WHEN calls > 0 THEN 1 END) as active_functions
FROM pg_stat_user_functions WHERE schemaname = 'public';

-- 2. Data Volume
SELECT 'carts' as table_name, COUNT(*) as row_count FROM carts
UNION ALL
SELECT 'cart_items', COUNT(*) FROM cart_items
UNION ALL
SELECT 'custom_builds', COUNT(*) FROM custom_builds
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
ORDER BY row_count DESC;

-- 3. Recent Errors
SELECT generated, message FROM pg_stat_statements 
WHERE query ILIKE '%error%' 
ORDER BY generated DESC LIMIT 10;

-- 4. Most Called Functions
SELECT funcname, calls, mean_time
FROM pg_stat_user_functions
ORDER BY calls DESC
LIMIT 10;

-- 5. Idempotency Status
SELECT 'Idempotency Enforcement',
       COUNT(*) as total_quotes,
       COUNT(DISTINCT idempotency_key) as unique_keys,
       COUNT(*) - COUNT(DISTINCT idempotency_key) as duplicate_keys
FROM quotes
WHERE idempotency_key IS NOT NULL;
```

---

## ALERTING RULES

**Configure these in your monitoring system (Datadog, New Relic, etc.)**

| Condition | Threshold | Action |
|-----------|-----------|--------|
| Function error rate | > 1% | Page on-call |
| RPC response time (p95) | > 500ms | Investigate |
| Cart creation failures | > 5/min | Alert |
| Quote idempotency violations | > 0 | Critical alert |
| RLS policy blocks (valid users) | > 10/hour | Investigate |
| Storage usage | > 80% | Warn |
| Connection pool exhaustion | > 90% | Alert |

---

**Last Updated**: 2026-04-05  
**Monitored By**: Supabase Dashboard + Custom Queries  
**Review Frequency**: Weekly
