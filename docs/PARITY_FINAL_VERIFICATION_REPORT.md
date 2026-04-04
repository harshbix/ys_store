# YS Store Parity Final Verification Report

Date: 2026-04-04
Status: Step 2-8 execution complete with explicit cutover risks documented.

## Objective

Validate real frontend to backend behavioral parity and expose hidden risks before cutover, without adding new product features.

## Verification Method

- Real browser execution using Playwright against production preview frontend (`127.0.0.1:4173`) and running backend (`127.0.0.1:4000`).
- Live API security matrix checks for guest/customer/admin contexts.
- Live storage bucket and media URL audit checks.
- Live latency sampling for contract-critical endpoints.

## Step-by-Step Results

### Step 1: Endpoint coverage gap report

- Completed in: `docs/PARITY_STEP1_ENDPOINT_COVERAGE_GAP_REPORT.md`
- This captured baseline gaps before real frontend execution started.

### Step 2: Real frontend flow parity (browser)

Executed and passing:
- Playwright suite: `frontend/e2e/parity.verify.spec.ts`
- Command result: 2 tests passed
  - guest product/cart/build/quote/session flow
  - admin login/create/upload/storefront rendering

Validated behaviors:
- Product list render, sort, and filter reflect backend responses.
- Cart add/remove and reload persistence hold consistent session identity.
- Build creation/component selection/validation/add-to-cart are functional.
- Quote generation preserves quote code format and total consistency.
- WhatsApp click tracking executes before redirect and rejects cross-session spoofing.
- Admin media upload + finalize works end-to-end and renders on storefront.

### Step 3: Guest session single-source-of-truth

Issues found during real flows:
- Origin mismatch (`localhost` vs `127.0.0.1`) and preview port mismatch (`4173`) caused CORS failures.
- Session token persistence drift risk on initial load/reload edge.

Fixes applied:
- `backend/src/app.js`
  - origin normalization
  - localhost/127.0.0.1 loopback expansion
  - default local allowlist includes 5173 and 4173
- `backend/src/middleware/guestSession.js`
  - cross-origin detection for cookie sameSite strategy
- `frontend/src/store/session.ts`
  - forced early persistence when in-memory session exists but storage state is missing
- `frontend/src/hooks/useGuestSession.ts`
  - eager initialization on mount

Result:
- Real frontend flow now preserves guest session continuity across refresh and cross-tab checks.

### Step 4: TanStack Query behavior validation

Reviewed mutation/query wiring and confirmed runtime behavior in browser flow:
- `useCart` invalidates `queryKeys.cart.current` on add/remove/update success.
- `useBuilds` invalidates active build query on component mutations and cart query on add-to-cart.
- `useAdmin` invalidates admin me/products/quotes keys on login and product mutations.

Runtime evidence:
- Guest flow observed mutation then refetch sequence for cart operations.
- Admin flow observed post-login and post-create/upload state refresh behavior.

Risk note:
- No optimistic UI rollback defects observed in tested flows.
- OTP/wishlist/persistent-cart customer flow is not yet covered by browser E2E.

### Step 5: Access control / RLS behavior under guest/auth/admin

Live matrix report:
- `backend/reports/rls-api-matrix-1775337887771.json`

Observed results:
- Guest build ownership: owner can read; attacker session gets 404 (`build_not_found`).
- Guest quote ownership: owner whatsapp-click succeeds; attacker session gets 404 (`quote_not_found`).
- Admin guard: no token and fake token are rejected (401); valid token succeeds (200).
- Customer scope: two real temp auth users got distinct wishlists; user A add did not leak into user B wishlist.

Architectural caveat:
- Backend repositories use service-role Supabase client for data operations. Practical access control is currently enforced in backend service logic; database RLS is not the primary runtime gate for API calls.

### Step 6: Storage real checks

Executed commands:
- `npm run storage:ensure-bucket`
- `npm run storage:audit-media`

Artifacts:
- `backend/reports/storage-audit-1775337342697.json`

Results:
- Bucket exists and is reachable.
- Audit script runtime issue (shop_media column mismatch) was fixed.
- Final audit reports 8 rows with non-canonical media URLs (external placeholder URLs).

### Step 7: Performance comparison

Live latency sample artifact:
- `backend/reports/parity-latency-1775337738237.json`

Current backend sample (12 requests each):
- `GET /api/products?page=1&limit=20&sort=newest`
  - p50: 342.27 ms
  - p95: 348.20 ms
- `GET /api/cart` (guest session)
  - p50: 669.18 ms
  - p95: 685.02 ms
- `POST /api/quotes` (cart source)
  - p50: 339.42 ms
  - p95: 1488.53 ms

Old-vs-new comparison status:
- Blocked in this workspace session (legacy runtime/baseline artifact not present to run side-by-side).

### Step 8: Final parity verdict

Verdict: **Conditional NO-GO for full cutover**

What is validated and stable:
- Core storefront guest flow: products, cart, build, quote, whatsapp tracking.
- Core admin create/upload/storefront rendering flow.
- Session continuity and cross-session ownership protections in tested paths.

What blocks full cutover:
- Storage canonicalization incomplete: 8 media rows still external/non-canonical.
- Customer auth/wishlist/persistent-cart not fully browser-E2E validated end-to-end.
- Legacy-vs-current performance comparison not completed due missing old runtime baseline.

## Additional parity hardening completed

Auth contract fix applied:
- `backend/src/modules/auth/service.js`
- `request-otp` now maps provider/client-side OTP errors to proper 4xx semantics (not always 500), including explicit 429 handling.

Fresh runtime validation on updated code:
- New backend instance returned 429 with structured error for throttled OTP request path.

## Recommended next cutover actions

1. Normalize the 8 non-canonical `product_media` URLs and rerun `storage:audit-media` until zero issues.
2. Add browser E2E for customer login (`request-otp`/`verify-otp`) plus wishlist and persistent-cart sync flow.
3. Run side-by-side latency sampling against legacy backend (same payloads/sample size) and attach delta table.
4. Reissue final go/no-go decision after those three checks are green.
