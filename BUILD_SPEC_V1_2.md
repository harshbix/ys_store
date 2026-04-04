# YS STORE Build Spec v1.3 (Supabase-First Update)

Status: Ready for implementation
Date: 2026-04-04
Replaces: v1.2

## 1) Why This Update

This version keeps all locked product behavior from v1.2, but adds the missing detail in three areas:

1. clear explanation of what the app does end-to-end
2. explicit list of current misses and risks
3. practical plan to simplify backend architecture by using Supabase directly

Goal: keep business behavior unchanged while reducing backend complexity, hosting cost, and integration friction.

## 2) What The App Does (Detailed)

### 2.1 Business model

- Quote-first commerce flow
- Customer discovery and selection happen on the website
- Final conversion and delivery discussion happen on WhatsApp
- No online payment in MVP

### 2.2 Customer journeys

1. Browse products
- Customer sees visible products, filters by type/spec/condition, and can open product details.

2. Compare products
- Customer selects multiple products and compares key specs/pricing side by side.

3. Build a custom PC
- Customer creates a draft build and selects components.
- System validates compatibility server-side.
- If auto-replacement is enabled, system can substitute incompatible parts with valid alternatives.
- Every replacement must be visible to user with reason.

4. Use cart as quote source
- Customer adds product or build items to cart.
- Cart supports guest and authenticated customer identities.

5. Create quote and continue on WhatsApp
- Customer submits minimal quote form (name required, notes optional).
- Quote and quote items are persisted before redirect.
- App generates quote code + WhatsApp message + WhatsApp URL.
- App tracks WhatsApp click initiation before redirect.

6. Optional customer login (OTP)
- OTP login is only required for save features.
- Saved features include wishlist, persistent cart sync, and saved builds.
- Guest users still complete browsing, builder, cart, and quote flows.

### 2.3 Admin journeys

- Single owner admin account
- Login/logout/me session flow
- Product CRUD with strict spec keys from spec_definitions
- Quick stock and visibility updates
- Quote list and status transitions
- Media upload and shop media management

### 2.4 Data guarantees already intended

1. product_specs keys are controlled by spec_definitions
2. quote items are immutable snapshots at quote creation time
3. builder compatibility runs on backend logic, not client-only logic
4. quote creation is idempotent by idempotency_key
5. WhatsApp click tracking is recorded before redirect

## 3) Current Misses (What v1.2 Did Not Fully Cover)

### 3.1 Product and UX misses

- No single section that explains the complete user journey from catalog to WhatsApp close.
- No explicit failure UX for key moments (OTP timeout, quote conflict, build validation failure).
- No defined fallback behavior if WhatsApp cannot open.

### 3.2 Architecture misses

- Current setup duplicates backend responsibility: Express API layer sits between frontend and Supabase for most operations.
- RLS is enabled in schema but policy matrix is not defined, so direct client-safe access is incomplete.
- No clear boundary of what must stay server-side (trusted logic) vs what can be direct Supabase CRUD.
- API contract is route-centric but not mapped to Supabase primitives (table/select/rpc/edge).

### 3.3 Security and auth misses

- Auth model split is not fully normalized (custom admin credential handling plus OTP flow) and can be simplified.
- Session ownership rules for guest carts/builds are not documented as RLS policies.
- Service-role usage boundaries are not explicitly documented per operation.

### 3.4 Ops and delivery misses

- v1.2 still left backend host choice open even though Supabase can remove most server hosting needs.
- No explicit migration plan from Express routes to Supabase-first integration.
- No defined runbook for backups, migrations, and rollback.

### 3.5 QA misses

- Tests focus on API behavior but not on RLS policy correctness.
- No explicit contract tests for Edge Functions and RPC argument compatibility.
- No smoke tests for cross-domain cookie/auth behavior across staging and production.

## 4) Locked Decisions (Carried Forward)

- Commerce model remains quote-first + WhatsApp handoff
- No online payment
- No installment workflow
- No benchmark/FPS subsystem
- Delivery details handled in WhatsApp chat
- Quote persisted before WhatsApp redirect
- Single admin (owner)
- Customer OTP only for save features
- Guest flow remains available for browse, build, cart, and quote

## 5) Supabase-First Backend Architecture (Simple Version)

### 5.1 Target architecture

- Frontend (Vite/React) talks directly to Supabase for read and normal write operations
- Supabase Postgres stores core data
- Supabase Auth handles customer auth and admin auth claims
- Supabase Storage handles media objects
- Supabase RPC handles transactional SQL operations
- Supabase Edge Functions handle trusted business logic not safe for direct client access

This removes the always-on Express server for MVP and keeps only Supabase-managed backend components.

### 5.2 What moves to which Supabase capability

| Capability | Supabase mechanism | Notes |
| --- | --- | --- |
| Public catalog read | PostgREST + RLS | Allow only visible products/views |
| Product detail by slug | PostgREST select with slug eq | Read-only public policy |
| Filter options | SQL view or RPC | Cached/materialized if needed |
| Compare | Client read + local compare or RPC | RPC if server-side normalization needed |
| Cart CRUD | PostgREST + RLS | Ownership by session_token or auth.uid |
| Build CRUD | PostgREST + RLS | Ownership policy required |
| Build validate + auto replace | Edge Function + SQL lookup | Trusted logic remains server-side |
| Quote create idempotent | RPC create_quote_transactional | Already present in migrations |
| WhatsApp URL generation | Edge Function | Builds template safely |
| WhatsApp click tracking | Edge Function or RPC | Must run before redirect |
| Wishlist/persistent cart | PostgREST + RLS | Authenticated only |
| Admin product and quote management | PostgREST + RLS (owner role) + optional Edge Functions | Use JWT claims role=owner |
| Media uploads | Storage signed upload URLs | Restrict bucket paths by role |
| Analytics event insert | Edge Function or constrained table insert | Validate event_name allowlist |

### 5.3 What is removed or reduced

- Remove dedicated Render-hosted Express API for MVP runtime
- Remove CORS and cookie complexity caused by frontend-backend split domains
- Reduce duplicate validation layers where DB constraints + RLS can enforce rules

## 6) Supabase Backend Contract (Operational)

### 6.1 Direct table access (client-safe)

- products, product_specs, product_media (read with public visibility constraints)
- carts, cart_items, custom_builds, custom_build_items (owned rows only)
- wishlists, wishlist_items (authenticated owner rows only)

### 6.2 RPC functions (transactional)

Required now:
- create_quote_transactional(p_items jsonb, p_quote jsonb)

Recommended additions:
- upsert_cart_item_transactional(...)
- validate_build_snapshot(...)
- track_whatsapp_click(...)

### 6.3 Edge Functions (trusted)

1. build-validate
- Input: build_id, auto_replace
- Output: compatibility_status, errors, warnings, replacements, normalized_items, total_estimated_tzs

2. quote-create
- Validates payload, resolves source cart/build ownership, calls create_quote_transactional RPC, returns quote summary and WhatsApp URL

3. quote-whatsapp-click
- Records whatsapp_click_initiated event and updates quote status safely

4. media-sign-upload
- Returns signed upload URL and required metadata constraints

5. analytics-ingest
- Validates allowlisted events and writes analytics row

## 7) Security Model (Must Be Explicit)

### 7.1 RLS baseline rules

1. Public read only for is_visible products and related media/spec rows
2. Guest cart/build rows accessible only by session_token claim
3. Auth customer rows accessible only where customer_auth_id = auth.uid()
4. Admin rows accessible only where JWT claim role = owner
5. quote_items not publicly readable except by linked quote owner/admin rules

### 7.2 Secrets and keys

- Frontend uses SUPABASE_URL + anon key only
- Service role key only in Edge Functions or secure CI/migration context
- No service-role key in frontend or browser-exposed bundles

### 7.3 Auth simplification

- Keep OTP for customer save features
- Move admin to Supabase Auth email/password with role metadata owner
- Remove custom admin JWT issuance where possible

## 8) Migration Plan From Current Build (Low Risk)

### Phase 0: Freeze behavior

- Keep existing API behavior as reference baseline
- Confirm all current tests pass before migration

### Phase 1: Policy-first hardening

- Add full RLS policies for all core tables
- Add policy tests (allow expected, deny unexpected)

### Phase 2: Read-path migration

- Move product/catalog/filter/compare reads to direct Supabase calls from frontend
- Keep Express routes as temporary fallback

### Phase 3: Write-path migration

- Move cart/build CRUD to direct Supabase with RLS
- Move quote and WhatsApp tracking to RPC + Edge Functions

### Phase 4: Admin and media migration

- Move admin product/quote actions to RLS-governed writes and targeted Edge Functions
- Move media upload flow to signed Storage URLs

### Phase 5: Decommission Express runtime

- Remove Render backend runtime dependency
- Keep only migration scripts, tests, and optional local dev helpers

## 9) Frontend Integration Changes Required

1. Add or standardize Supabase client wrapper in frontend API layer
2. Replace route-based calls with:
- direct table queries for simple CRUD/read
- RPC calls for transactional operations
- Edge Function calls for trusted workflows
3. Keep query keys and React Query cache strategy unchanged where possible
4. Keep idempotency_key generation in frontend for quote creation
5. Preserve analytics event firing points in UI flow

## 10) Testing Matrix (Updated)

### Critical

- quote idempotency via RPC
- quote snapshot immutability
- build compatibility validity and replacement transparency
- whatsapp click tracking before redirect
- spec_definitions FK integrity and unique(product_id, spec_key)
- RLS ownership enforcement for guest and authenticated users

### High

- cart persistence through guest-to-auth merge path
- admin owner-only write access
- signed upload URL constraints and path isolation
- analytics event allowlist enforcement

### Medium

- filter and compare performance under seed data growth
- Edge Function timeout/retry behavior
- migration rollback test from each phase

## 11) Definition Of Done For Supabase-First MVP

All must be true:

1. Core customer flows run with no always-on custom backend server
2. Quote creation is transactional and idempotent via Supabase RPC/Edge
3. Build validation and auto-replacement run in trusted backend logic (Edge Function)
4. Admin operations are role-protected by Auth + RLS
5. Media upload is signed and scoped
6. Analytics events are validated and stored with expected schema
7. Existing business behavior from v1.2 is preserved

## 12) Immediate Implementation Checklist

1. Write RLS policy matrix document per table
2. Implement missing policies and policy tests
3. Create Edge Functions for build-validate, quote-create, quote-whatsapp-click, analytics-ingest, media-sign-upload
4. Migrate frontend read paths to direct Supabase queries
5. Migrate write paths in staged order (cart/build -> quote -> admin/media)
6. Remove Express runtime from production deployment once parity tests pass

## 13) Resolved Unknowns

1. Backend host choice is no longer required for MVP runtime if Supabase-first path is adopted
2. Admin bootstrap should use Supabase Auth seeded owner account and role metadata
3. Warranty text matrix remains business content workstream and does not block architecture simplification
