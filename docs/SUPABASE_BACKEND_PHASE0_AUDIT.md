# YS Store Phase 0 Audit

Date: 2026-04-04
Scope: Current frontend/backend parity baseline before any migration implementation.
Status: Complete for Phase 0 only. No implementation changes applied.

## Method And Evidence

This audit was derived from:
- Backend route/controller/service/repository code.
- Frontend API layer, hooks, pages, and key components.
- Backend migrations and seed data.
- Existing backend test suite.

Primary source paths:
- backend/src/routes/index.js
- backend/src/modules/**
- backend/src/middleware/**
- backend/src/utils/**
- backend/supabase/migrations/**
- frontend/src/api/**
- frontend/src/hooks/**
- frontend/src/pages/**
- frontend/src/components/**
- frontend/src/lib/queryKeys.ts

---

## A. Frontend API Contract Inventory

### A.1 Common Envelope Contract

Success envelope (all successful endpoints):
- HTTP 200 or 201
- Body:
  - success: true
  - message: string
  - data: object | array | primitive payload for endpoint

Error envelope (all handled failures):
- HTTP 4xx or 5xx
- Body:
  - success: false
  - error_code: string
  - message: string
  - details: object | null

Validation failure shape:
- HTTP 400
- error_code: validation_error
- details: zod flatten output

Rate limit shape:
- HTTP 429
- error_code: rate_limited

### A.2 Cross-Cutting Request Behavior

Frontend request defaults:
- credentials: include (cookies always sent).
- Content-Type: application/json for non-FormData.
- x-guest-session: sent from Zustand session store when available.
- Authorization:
  - Auto-added for /admin* when admin token exists.
  - Auto-added for /auth* when customer token exists.
  - Some API methods also pass Authorization explicitly.

Backend auth/session reality:
- Guest identity in backend is cookie-driven via ensureGuestSession.
- Cookie name default: ys_session.
- x-guest-session header is currently not consumed by backend middleware.

### A.3 Active Frontend-Used Endpoints (Runtime)

| Method | Path | Request (headers/body/query) | Response data shape | Status codes used | Frontend dependencies | Risk |
|---|---|---|---|---|---|---|
| GET | /api/products | Query: type, brand, condition, min_price, max_price, cpu, gpu, ram_gb, storage_gb, screen_size, refresh_rate, stock_status, page, limit, sort | { items: Product[], total: number } | 200, 400, 500 | Home product rails, Shop page, related products, builder picker, search overlay | HIGH |
| GET | /api/products/:slug | Params: slug | ProductDetail (Product + specs[] + media[]) | 200, 404, 500 | Product detail page, local wishlist hydration | HIGH |
| GET | /api/cart | Cookie session, x-guest-session sent by frontend | CartPayload: { cart, items[], estimated_total_tzs } | 200, 500 | Header count, mobile nav count, cart drawer, cart page, checkout, auth sync pre-read | HIGH |
| POST | /api/cart/items | Body: { item_type, product_id?, custom_build_id?, quantity? } | CartPayload | 201, 400, 500 | Product cards quick add, product detail add, build add-to-cart flow | HIGH |
| PATCH | /api/cart/items/:itemId | Body: { quantity } | CartPayload | 200, 400, 500 | Cart page + cart drawer quantity update | HIGH |
| DELETE | /api/cart/items/:itemId | Params: itemId | CartPayload | 200, 400, 500 | Cart page + cart drawer remove | HIGH |
| POST | /api/builds | Body: { name? } | CustomBuild | 201, 400, 500 | Builder page ensureBuild path | HIGH |
| GET | /api/builds/:buildId | Params: buildId | BuildPayload (build + items[]) | 200, 400, 404, 500 | Builder page load/refresh | HIGH |
| PATCH | /api/builds/:buildId/items | Body: { component_type, product_id } | BuildPayload | 200, 400, 404, 500 | Builder component selection | HIGH |
| DELETE | /api/builds/:buildId/items/:itemId | Params: buildId, itemId | BuildPayload | 200, 400, 404, 500 | Builder component removal | HIGH |
| POST | /api/builds/:buildId/validate | Body: { auto_replace } | BuildValidationPayload | 200, 400, 404, 500 | Builder validation banner/flow | HIGH |
| POST | /api/builds/:buildId/add-to-cart | Params: buildId | { build_id, cart: CartPayload } | 200, 400, 404, 500 | Builder add build to cart | HIGH |
| POST | /api/quotes | Headers: x-idempotency-key or Idempotency-Key optional, cookie session | QuoteRecord with whatsapp_url and whatsapp_meta | 201, 400, 404, 429, 500 | Checkout quote creation | CRITICAL |
| POST | /api/quotes/:quoteCode/whatsapp-click | Params: quoteCode | QuoteRecord (status/time update) | 200, 400, 404, 500 | Checkout WhatsApp CTA pre-navigation tracking | CRITICAL |
| POST | /api/auth/request-otp | Body: { email } | { challenge_id } | 201, 400, 429, 500 | Customer login page step 1 | HIGH |
| POST | /api/auth/verify-otp | Body: { email, challenge_id, code } | { access_token, customer_id, challenge_id } | 200, 400, 401, 500 | Customer login page step 2 | HIGH |
| GET | /api/auth/wishlist | Authorization bearer customer token | { wishlist_id, items[] } | 200, 401, 500 | Wishlist page (authenticated mode) | MEDIUM |
| POST | /api/auth/wishlist/items | Authorization + body { product_id } | { wishlist_id, items[] } | 201, 400, 401, 500 | Wishlist toggle (authenticated mode) | MEDIUM |
| DELETE | /api/auth/wishlist/items/:productId | Authorization + params | { wishlist_id, items[] } | 200, 400, 401, 500 | Wishlist remove (authenticated mode) | MEDIUM |
| PUT | /api/auth/customer/persistent-cart/sync | Authorization + body { source_cart_id? items? } | { customer_auth_id, cart, items[], estimated_total_tzs } | 200, 400, 401, 500 | Login flow guest->customer merge | HIGH |
| POST | /api/admin/login | Body { email, password } | { token, admin } | 200, 400, 401, 403, 429, 500 | Admin login page | HIGH |
| POST | /api/admin/logout | Authorization admin token | { logged_out: true } | 200, 401, 403 | Admin logout action | LOW |
| GET | /api/admin/me | Authorization admin token | { admin } | 200, 401, 403 | Admin session restoration | MEDIUM |
| GET | /api/admin/products | Authorization admin token | AdminProduct[] | 200, 401, 403, 500 | Admin dashboard catalog table | HIGH |
| GET | /api/admin/products/:id | Authorization admin token | AdminProductDetail (product + specs + media) | 200, 400, 401, 403, 404, 500 | Admin edit form hydration | HIGH |
| POST | /api/admin/products | Authorization + AdminProductPayload | AdminProduct | 201, 400, 401, 403, 500 | Admin create product | HIGH |
| PATCH | /api/admin/products/:id | Authorization + AdminProductPayload | AdminProduct | 200, 400, 401, 403, 500 | Admin update product | HIGH |
| POST | /api/admin/products/:id/duplicate | Authorization | AdminProduct | 201, 400, 401, 403, 404, 500 | Admin duplicate action | MEDIUM |
| PATCH | /api/admin/products/:id/visibility | Authorization + { is_visible } | AdminProduct | 200, 400, 401, 403, 500 | Admin archive/publish | MEDIUM |
| GET | /api/admin/quotes | Authorization admin token | QuoteRecord[] | 200, 401, 403, 500 | Admin quote list | HIGH |
| POST | /api/media/admin/upload-url | Authorization + { owner_type, owner_id?, file_name, content_type, variant } | { path, token, signed_url } | 200, 400, 401, 403, 500 | Admin media upload step 1 | HIGH |
| POST | /api/media/admin/upload/finalize | Authorization + finalize payload | created media row | 201, 400, 401, 403, 500 | Admin media upload step 2 | HIGH |

### A.4 Frontend API Layer Endpoints Present But Not Currently Invoked In UI Flow

| Method | Path | Frontend API function exists | Current runtime usage | Risk |
|---|---|---|---|---|
| GET | /api/auth/customer/persistent-cart | getPersistentCustomerCart | Not called by hooks/pages/components | LOW |
| GET | /api/quotes/:quoteCode | getQuoteByCode | Not called by hooks/pages/components | LOW |
| GET | /api/quotes/:quoteCode/whatsapp-url | getQuoteWhatsappUrl | Not called by hooks/pages/components | LOW |

### A.5 High-Risk Contract Hotspots

- Quote create and WhatsApp tracking are the highest sensitivity business path.
- Cart/build endpoints are stateful and deeply tied to navigation/header UX.
- Admin product + media flows are tightly coupled to dashboard behavior.
- Any envelope drift (success/message/data or error_code/message/details) will break user-facing assumptions.

---

## B. Data Model Audit

### B.1 Entity Inventory (Fields, Relations, Constraints, Ownership)

### 1) Products

Primary tables:
- products
- product_specs
- product_media
- spec_definitions (supporting schema dictionary)

Key fields:
- products: id, sku, slug, title, product_type, brand, model_name, condition, stock_status, estimated_price_tzs, descriptions, warranty_text, visibility/featured flags, created_by_admin_id, timestamps.
- product_specs: product_id, spec_key, one of value_text/value_number/value_bool/value_json, unit, sort_order.
- product_media: product_id, original_url, thumb_url, full_url, alt_text, is_primary, sort_order.

Relations:
- products 1:N product_specs.
- products 1:N product_media.
- product_specs.spec_key -> spec_definitions.spec_key.

Constraints:
- products.sku unique.
- products.slug unique.
- products.estimated_price_tzs >= 0.
- product_specs one-value check (exactly one typed value present).
- product_specs unique(product_id, spec_key).

Derived/computed usage:
- Listing filters use product fields plus product_specs text/number lookups.
- Product detail aggregates specs + media in service layer.

Indexing status:
- Present: price, condition, product_type+stock_status+is_visible, spec key text/number indexes.
- Missing or weak for scale: dedicated brand index, products(created_at) index for newest sort.

Ownership model:
- System/admin-owned content.
- Public storefront reads constrained by is_visible in repository queries.

### 2) Cart Sessions

Primary tables:
- carts
- cart_items

Key fields:
- carts: id, session_token, customer_auth_id, status, timestamps.
- cart_items: cart_id, item_type, product_id/custom_build_id ref, quantity, unit_estimated_price_tzs, title_snapshot, specs_snapshot.

Relations:
- carts 1:N cart_items.
- cart_items ref to products/custom_builds.
- quotes.source_cart_id optional ref carts.id.

Constraints:
- carts.session_token unique.
- cart_items one ref check (exactly one of product_id/custom_build_id).
- quantity > 0, unit_estimated_price_tzs >= 0.

Derived/computed fields:
- estimated_total_tzs is computed in service from cart_items.

Indexing status:
- Present: carts(customer_auth_id), carts(status,updated_at), cart_items(cart_id,product_id,custom_build_id).
- Session linkage: session_token unique index implicitly exists.

Ownership model:
- Guest: session_token.
- Authenticated: customer_auth_id.
- Note: update/delete cart item by item id currently lacks explicit owner check in service path.

### 3) Builds

Primary tables:
- custom_builds
- custom_build_items
- compatibility_rules (support)

Key fields:
- custom_builds: build_code, owner_type, customer_auth_id, session_token, name, build_status, compatibility_status, replacement_summary, total_estimated_price_tzs, is_saved.
- custom_build_items: custom_build_id, component_type, product_id, quantity, unit_estimated_price_tzs, is_auto_replaced, compatibility_notes.

Relations:
- custom_builds 1:N custom_build_items.
- custom_build_items.product_id -> products.id.
- quotes.source_build_id optional ref custom_builds.id.

Constraints:
- custom_builds.build_code unique.
- quantity and price non-negative checks.
- unique slot index on custom_build_items(custom_build_id, component_type) for single-slot components.

Derived/computed fields:
- total_estimated_price_tzs recomputed from items.
- compatibility_status/build_status set by validation service.

Indexing status:
- Present: build customer/session/status indexes, build item component index.

Ownership model:
- owner_type guest/customer plus session/customer ids.
- Note: getBuild by id currently does not enforce identity ownership in service.

### 4) Quotes

Primary tables:
- quotes
- quote_items

Key fields:
- quotes: quote_code, quote_type, status, customer_name, notes, estimated_total_tzs, source_cart_id/source_build_id, idempotency_key, replacement_summary, whatsapp_message, whatsapp_clicked_at, closed_reason, timestamps.
- quote_items: quote_id, item refs, title/spec snapshots, quantity, unit_estimated_price_tzs, line_total_tzs.

Relations:
- quotes 1:N quote_items.
- optional refs back to source cart/build.

Constraints:
- quote_code unique.
- idempotency_key unique.
- quantity and totals non-negative checks.

Derived/computed fields:
- estimated_total_tzs computed transactionally from item array in RPC.
- whatsapp_url generated at response time (not persisted).

Indexing status:
- Present: status+created_at, quote_type, source_cart_id, idempotency unique.
- quote_code unique index implicitly present.

Ownership model:
- No dedicated customer/session ownership columns in quotes table.
- Access today is code-based route and admin routes.

### 5) Admins / Users

Primary tables and identity sources:
- admin_users table for admin profile/role metadata.
- customer identity from Supabase Auth user id (UUID) and local JWT wrapper.

Key fields:
- admin_users: id, email, full_name, role(owner), is_active, last_login_at, timestamps.
- customer auth id carried in carts/builds/wishlists/analytics.

Ownership model:
- Admin routes require JWT role owner.
- Customer routes require JWT type customer.

### 6) Uploads / Images

Primary persistence:
- Supabase Storage bucket (env configured).
- product_media and shop_media rows store resolved public URLs.

Key fields:
- product_media: product_id, original_url, thumb_url, full_url, metadata.
- shop_media: same URL trio + caption/visibility/order.

Ownership model:
- Admin protected upload/finalize endpoints.

### 7) Analytics / Event Tracking

Primary table:
- analytics_events

Key fields:
- event_name enum, session_token, customer_auth_id, optional product/build/quote refs, page_path, metadata jsonb, created_at.

Indexing:
- event_name+created_at, session_token, quote_id.

Ownership model:
- Server-driven inserts from quote flows and optional analytics endpoint.

### B.2 Indexing Coverage Against Migration Needs

Covered by existing schema:
- slug (unique).
- type (product_type in composite index).
- condition.
- price.
- cpu/gpu/ram/storage filters via product_specs key+text/number indexes.
- stock_status in composite index.
- session linkage (carts.session_token unique, build session index, cart/build customer indexes).
- quote_code unique.
- idempotency_key unique.

Needs improvement for high-volume parity:
- products.brand dedicated index not present.
- products.created_at dedicated index not present (newest sort currently on created_at).
- Additional targeted composite indexes may be needed for common storefront filters under production volume.

---

## C. Auth / Session Audit

### C.1 Guest Session Creation And Persistence

Current behavior:
- Backend ensureGuestSession creates cookie token if missing.
- Cookie defaults:
  - name: ys_session (configurable)
  - httpOnly: true
  - sameSite: none in production, lax in non-prod
  - secure: true in production
  - maxAge: configured days (default 30)

Frontend behavior:
- Frontend generates and persists guestSessionId in local storage (Zustand persist).
- Frontend sends x-guest-session header on requests.

Important parity finding:
- Backend currently does not consume x-guest-session.
- Effective guest identity is backend cookie token, not header token.

### C.2 Customer Auth

Current behavior:
- OTP request/verify via Supabase Auth.
- On verify, backend issues its own JWT (type: customer) signed with ADMIN_JWT_SECRET.
- Token stored in frontend persisted auth store.

Linked resources:
- wishlists.customer_auth_id
- carts.customer_auth_id
- custom_builds.customer_auth_id
- analytics_events.customer_auth_id

Guest-to-auth merge behavior:
- useAuth flow calls getCart then syncPersistentCustomerCart(source_cart_id).
- Backend merges items into customer cart, then marks guest source cart expired.

### C.3 Admin Auth

Current behavior:
- Admin login checks env ADMIN_EMAIL + ADMIN_PASSWORD (credential gate).
- Then admin profile lookup in admin_users table.
- JWT issued with role owner and signed by ADMIN_JWT_SECRET.

Risk note:
- Admin auth is not yet fully delegated to Supabase Auth role claims.

### C.4 Identity Linkage Summary

- Cart linkage: session_token or customer_auth_id.
- Build linkage: owner_type + session/customer ids.
- Quote linkage: source_cart_id/source_build_id only (no direct customer/session column).
- Wishlist linkage: customer_auth_id.

### C.5 Session/Token Storage Locations In Frontend

- ys-session-storage (guest session + activeBuildId + local wishlist).
- ys-customer-auth (customer token/profile ids).
- ys-admin-auth (admin token/profile).

---

## D. Storage Audit

### D.1 Uploaded Assets

- Product image variants: original, thumb, full.
- Shop media variants: original, thumb, full.

### D.2 Current Storage Backing

- Supabase Storage bucket via env SUPABASE_STORAGE_BUCKET.
- Upload uses signed upload URLs from backend media service.

### D.3 Naming And Path Conventions

createUploadUrl path strategy:
- Product owner:
  - products/{owner_id or unassigned}/{variant}/{timestamp}-{sanitized_file_name}
- Shop owner:
  - shop/{variant}/{timestamp}-{sanitized_file_name}

sanitizeName rules:
- lowercased
- non [a-z0-9._-] replaced with '-'

### D.4 URL Structure Persisted To DB

finalizeUpload resolves public URLs via storage getPublicUrl and stores:
- original_url
- thumb_url
- full_url

### D.5 Frontend Consumption Pattern

Product image resolution order:
- primary_image_url
- thumb_url
- full_url
- original_url
- first media item (prefers primary)
- placeholder by product type/component keyword mapping

Admin dashboard media preview:
- thumb_url -> full_url -> original_url fallback.

### D.6 Current Mixed-Source Reality

- Seed/demo data stores external picsum URLs directly in product_media.
- Uploaded assets use Supabase public URLs.
- This means mixed URL hosts can exist today.

---

## E. Custom Business Logic Audit

### E.1 Quote Generation (Critical)

Location:
- backend/src/modules/quotes/service.js
- backend/src/utils/quoteCode.js
- backend/src/utils/whatsapp.js
- backend/supabase/migrations/007_create_quote_transactional_rpc.sql
- backend/supabase/migrations/008_fix_quote_rpc_signature.sql

Behavior:
- Idempotency check on quotes.idempotency_key before creation.
- Source cart path snapshots each cart item into quote item rows.
- Source build path creates a single custom_build quote item with component snapshot in specs_snapshot.
- estimated_total_tzs computed from line totals.
- quote_type inference:
  - explicit payload wins,
  - else build source => build,
  - else heuristics by item title containing laptop/desktop,
  - else general.
- quote_code format:
  - Prefix by quote type (LAP, DESK, BUILD, UPG, WAR, QUOTE)
  - Suffix 5-char random token from A-Z and 2-9 (excluding ambiguous characters).
- Transactional persistence through RPC create_quote_transactional.
- RPC handles unique_violation on idempotency key by returning existing quote.

### E.2 WhatsApp Message And URL Construction (Critical)

Behavior:
- Message lines include quote id, customer name, numbered items, estimated total, optional notes.
- URL format: https://wa.me/{WHATSAPP_PHONE_E164}?text={encoded_message}
- Fallback when URL length > 1800:
  - Uses short generic message while keeping same wa.me target.
- Response from quote create includes whatsapp_url and whatsapp_meta.

### E.3 WhatsApp Click Tracking

Behavior:
- POST /quotes/:quoteCode/whatsapp-click:
  - updates quote status to whatsapp_sent and sets whatsapp_clicked_at
  - only for current status in [new, whatsapp_sent]
  - inserts analytics events:
    - whatsapp_click_initiated
    - whatsapp_click
- Frontend button intentionally proceeds navigation even if tracking fails.

### E.4 Cart Merge Behavior

Location:
- backend/src/modules/auth/service.js syncPersistentCart

Behavior:
- If source_cart_id provided:
  - reads source cart items
  - merges by item identity (item_type + ref)
  - increments quantity on collisions
  - marks source cart status expired
- If payload.items provided directly:
  - inserts with default/generic snapshots where needed

### E.5 Build Validation And Compatibility Rules

Location:
- backend/src/modules/builds/service.js

Behavior currently implemented in service code:
- CPU socket vs motherboard socket.
- GPU length vs case max GPU length.
- RAM type vs motherboard RAM type.
- PSU wattage vs estimated system wattage headroom (120%).

Auto-replace behavior:
- Attempts replacement candidate queries by spec text/number.
- Replacement candidates constrained to products where:
  - product_type = component
  - is_visible = true
  - stock_status != sold_out

Result payload contract:
- compatibility_status
- errors[]
- warnings[]
- replacements[]
- normalized_items[]
- total_estimated_tzs
- rules_count

Important finding:
- compatibility_rules table is fetched for count/visibility, but decisions are hardcoded in service logic today.

### E.6 Inventory / Condition Logic

- Storefront list endpoint supports condition and stock_status filters.
- Build replacement excludes sold_out candidates.
- Cart add does not enforce stock status checks.

### E.7 Pricing Calculations

- Cart total: sum(item.unit_estimated_price_tzs * quantity).
- Build total: sum(build item unit * quantity).
- Quote total: computed in transactional RPC from submitted item array.

### E.8 Idempotency Handling

- Middleware priority:
  1) x-idempotency-key header
  2) deterministic sha256 hash of source_type/source_id/customer_name/notes
- Service persists key in quotes.idempotency_key unique column.

### E.9 Analytics Tracking

- Server-side event insert in quote create and WhatsApp click flows.
- Optional /api/analytics/events endpoint exists but is not used in current frontend runtime.

### E.10 Admin Upload Workflow

- Step 1: obtain signed upload URL per variant.
- Step 2: client PUTs binary to signed URL.
- Step 3: finalize endpoint persists media metadata and public URLs.

---

## F. TanStack Query / Frontend Behavior Audit

### F.1 Global Query Client Defaults

- retry: 1
- refetchOnWindowFocus: false

### F.2 Query Keys And Query Contracts

Query keys:
- products.list(filters)
- products.detail(slug)
- cart.current
- builds.detail(buildId)
- auth.wishlist
- admin.me
- admin.products
- admin.productDetail(productId)
- admin.quotes
- quotes.detail(quoteCode) defined but not used in active runtime

Query behavior:
- Products list/detail: staleTime 30s, retry 1.
- Cart current: staleTime 10s, retry 1.
- Build detail: staleTime 10s, retry 1, enabled only when active build id exists.
- Auth wishlist: staleTime 60s, retry 1.
- Admin me: staleTime 60s, retry 0.
- Admin products/quotes: staleTime 30s, retry 1.
- Admin product detail query on dashboard: staleTime 30s, retry 1.

### F.3 Mutation And Invalidation Flow

Cart:
- add/update/remove mutate then invalidate cart.current.

Build:
- create: set activeBuildId and invalidate build detail key.
- upsert/delete: invalidate build detail.
- add-to-cart: invalidate cart.current.
- validate: no automatic cache write, response consumed directly in UI.

Auth/Wishlist:
- verify OTP success triggers:
  - guest cart read
  - persistent cart sync
  - invalidate auth.wishlist and cart.current
- logout invalidates wishlist and cart.
- wishlist remote toggle/remove invalidates auth.wishlist.

Admin:
- login invalidates admin.me, admin.products, admin.quotes.
- create/update/duplicate/archive/publish invalidate admin products and relevant detail keys.
- media upload finalize invalidates product detail and products list.
- logout removes admin query caches.

### F.4 Optimistic Update Behavior

Current state:
- No optimistic cache updates are implemented (no onMutate/setQueryData usage).
- UX assumes server-confirmed mutations followed by invalidation/refetch.

Parity implication:
- Backend mutation timing and eventual consistency must preserve current toast + refresh experience; no hidden optimistic expectations exist.

### F.5 Error/Fallback Assumptions

- API client normalizes/strips accidental /api prefix in endpoint inputs.
- In production, missing VITE_API_URL triggers persistent API unavailable banner.
- Dev fixture fallback exists only when DEV and VITE_ENABLE_DEV_FIXTURES is true:
  - products/cart/builds/quotes APIs can return fixture data on failures.
  - auth/admin flows do not use fixture fallback.

---

## Parity Risk Register (Phase 0)

CRITICAL:
- Quote code format, idempotency behavior, WhatsApp URL format must not drift.
- Quote create and click-tracking response shape must remain identical.

HIGH:
- Cart/build persistence is tightly coupled to header counters, drawer state, checkout readiness.
- Guest session compatibility currently depends on cookies despite frontend x-guest-session header.
- Admin product + media flow is sensitive to response timing and shape.

MEDIUM:
- Wishlist/persistent cart sync linkage and token handling must remain unchanged in first migration.
- Product filter/sort performance may degrade without missing indexes (brand, created_at).

SECURITY OBSERVATIONS TO CARRY INTO MIGRATION PLAN:
- Service role backend currently bypasses RLS policy enforcement as primary control.
- Some resource ownership checks are weak in existing service paths (must be parity-safe but hardened carefully).

---

## Phase 0 Exit Criteria (Met)

- Frontend-used endpoint inventory captured with method/path/request/response/status/dependencies/risk.
- Data model entities, constraints, relations, computed fields, indexing and ownership mapped.
- Auth/session and storage behavior documented.
- Non-trivial business logic and TanStack Query behavior documented.

Next phase in required order: Phase 1 proposal for Supabase schema and migration plan.