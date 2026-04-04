# YS Store Parity Final Verification Report

Date: 2026-04-05
Status: Functional cutover blockers resolved. Legacy-vs-new latency comparison remains an external evidence gap (legacy runtime unavailable).

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
- Command result: 3 tests passed (`3 passed (1.1m)`)
  - guest product/cart/build/quote/session flow
  - admin login/create/upload/storefront rendering
  - customer request-otp/verify/auth-persistence/wishlist/cart-sync/logout flow

Validated behaviors:
- Product list render, sort, and filter reflect backend responses.
- Cart add/remove and reload persistence hold consistent session identity.
- Build creation/component selection/validation/add-to-cart are functional.
- Quote generation preserves quote code format and total consistency.
- WhatsApp click tracking executes before redirect and rejects cross-session spoofing.
- Admin media upload + finalize works end-to-end and renders on storefront.
- Customer flow validated end-to-end:
  - request OTP endpoint call observed from browser
  - OTP verify success with real Supabase-generated OTP code
  - authenticated session persisted across reload
  - wishlist add/remove via authenticated API
  - persistent customer cart sync verified before/after reload
  - logout clears persisted customer auth state

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
- Customer flow observed verify -> persistent-cart sync mutation -> cart/wishlist invalidation behavior.

Risk note:
- No optimistic UI rollback defects observed in tested flows.
- No customer-flow cache/regression anomaly observed in executed browser scenarios.

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
- `backend/reports/storage-normalization-1775339633196.json`
- `backend/reports/storage-audit-1775339637372.json`
- `backend/reports/storage-audit-1775341385136.json`

Results:
- Bucket exists and is reachable.
- Audit script runtime issue (shop_media column mismatch) was fixed.
- 8 non-canonical `product_media` rows were normalized to canonical Supabase bucket URLs, with old and new values captured in normalization report.
- Final re-audit after subsequent E2E runs reports `rows_with_issues: 0`.

Rows changed during normalization:
- `06f9601c-49aa-48b9-9ad7-4a9149c1810f`
- `08fe356e-6eb5-4a74-ae05-cb449092c8dc`
- `1824f9f5-dac3-48d6-b7fe-0efc0f9e9f68`
- `2e772583-8f80-4f4e-9e5f-d60105d4950a`
- `4c71bb29-b7c4-4083-86d8-126204b80ac1`
- `6898c975-997c-4092-9f6f-e4098e9d86a2`
- `84a8e315-8d13-44a8-8070-c74b7095c4b6`
- `d50aea1e-4027-407a-9bd5-399cc8aa7f82`

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
- Unavailable in this workspace/session: legacy runtime endpoint is not available (no `LEGACY_*` runtime URL or equivalent baseline target configured), so side-by-side p50/p95 cannot be produced without fabrication.

Cutover classification of this gap:
- **Non-blocking evidence gap** based on the documented cutover criteria emphasis on behavioral parity (contract + flow), security/access validation, and rollback safety.
- Rationale: required guest/admin/customer parity flows are passing in real browser execution, storage canonicalization is complete (`rows_with_issues: 0`), and rollback remains instant by restoring prior API base URL.

### Step 8: Final parity verdict

Verdict: **CONDITIONAL GO**

What is validated and stable:
- Core storefront guest flow: products, cart, build, quote, whatsapp tracking.
- Core admin create/upload/storefront rendering flow.
- Core customer flow: request OTP coverage, verify, session persistence, wishlist lifecycle, persistent-cart sync, logout.
- Session continuity and cross-session ownership protections in tested paths.

What remains open:
- Legacy-vs-current latency comparison evidence is not available because a reachable legacy runtime endpoint/configuration was not provided in this session.

## Additional parity hardening completed

Auth contract fix applied:
- `backend/src/modules/auth/service.js`
- `request-otp` now maps provider/client-side OTP errors to proper 4xx semantics (not always 500), including explicit 429 handling.

Auth/session isolation fix applied:
- `backend/src/modules/auth/repository.js`
- OTP request/verify now use an isolated Supabase auth client so auth session state from `verifyOtp` does not contaminate the shared service-role data client.
- This removes the observed post-login `500` failures on `/api/cart` and `/api/auth/customer/persistent-cart` during browser flow.

Fresh runtime validation on updated code:
- New backend instance returned 429 with structured error for throttled OTP request path.

## Recommended next cutover actions

1. Proceed with cutover under **Conditional GO** with active monitoring on products/cart/quotes latency during initial release window.
2. Provide reachable legacy backend endpoint/runtime when available.
3. Run side-by-side latency sampling (`GET /api/products`, `GET /api/cart`, `POST /api/quotes`) and attach p50/p95 delta table as post-cutover evidence completion.
