# YS Store Phase 1 Report
## Product Flow (Only)

Date: 2026-04-06  
Scope: Frontend product browsing flow only (`Home`, `Shop`, `Product Detail`, related product rails, component picker).

## 1) Architecture Gate (Pass)

Active product runtime data path is Supabase direct, not Express API.

Evidence from code search:
- Product fetch entry points: `frontend/src/api/products.ts` (`getProducts`, `getProductBySlug`).
- Product query hooks: `frontend/src/hooks/useProducts.ts`.
- Product-flow consumers: `frontend/src/pages/HomePage.tsx`, `frontend/src/pages/ShopPage.tsx`, `frontend/src/pages/ProductDetailPage.tsx`, `frontend/src/components/ui/ProductRail.tsx`, `frontend/src/components/builder/BuildPartPicker.tsx`, `frontend/src/components/ui/SearchResultsOverlay.tsx`.
- No `apiClient`, `VITE_API_URL`, or `/api/` usage in active Product Flow files above.

Conclusion: Product Flow is single-source (Supabase direct) and can proceed.

## 2) Seed/Data Prerequisite Gate (Blocked)

Hosted visibility check (anon key) returned zero visible products:
- `VISIBLE_COUNT=0`

Latest rerun status:
- Rechecked during this checkpoint with hosted anon key against `products?is_visible=eq.true`.
- Result remained `VISIBLE_COUNT=0`.

Command performed in workspace terminal:
- Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `frontend/.env.local`.
- Called `GET {SUPABASE_URL}/rest/v1/products?select=id&is_visible=eq.true`.

Result: Product Flow cannot be fully runtime-verified until visible catalog seed data is present in hosted Supabase.

## 3) Product Contract Hardening Applied

File changed:
- `frontend/src/api/products.ts`

Changes made:
- Normalized list payload to canonical shape: `{ items, total }`.
- Added exact count query option for paging total accuracy.
- Normalized detail payload to canonical shape with mapped fields: `specs` and `media`.
- Added media URL normalization for storage path to public URL conversion on `original_url`, `thumb_url`, and `full_url`.

Why this was required:
- Product pages/components in runtime consume `items` and detail-level `specs`/`media`.
- Pre-existing mismatch (`products` + `product_specs`/`product_media`) caused drift and runtime fragility.

## 4) Verification Performed

Type diagnostics:
- No errors in product-flow files after change.

Frontend build:
- Command: `npm run build` (in `frontend/`)
- Result: Pass

Product-flow consumer shape audit:
- `frontend/src/pages/HomePage.tsx` reads `productsQuery.data?.items`.
- `frontend/src/pages/ShopPage.tsx` reads `productsQuery.data?.items` and `productsQuery.data?.total`.
- `frontend/src/pages/ProductDetailPage.tsx` reads detail from `detailQuery.data` and related list from `relatedQuery.data?.items`.
- `frontend/src/components/ui/ProductRail.tsx` reads `query.data?.items`.
- `frontend/src/components/builder/BuildPartPicker.tsx` reads `productsQuery.data?.items`.
- `frontend/src/components/ui/SearchResultsOverlay.tsx` reads `productsQuery.data?.items`.

Audit conclusion:
- No remaining old `data.data.items` assumptions were found in active Product Flow consumers.

Visibility filtering verification (code-level):
- Product list query enforces `is_visible = true` in `frontend/src/api/products.ts`.
- Product detail query enforces `is_visible = true` in `frontend/src/api/products.ts`.

## 5) Current Blocker

Blocking condition:
- No visible products in hosted DB (`VISIBLE_COUNT=0`).

Impact:
- Full Product Flow runtime validation with real hosted product data remains blocked by data availability, not by current frontend contract code.

Runtime state verification status at this checkpoint:
- HomePage product rendering from hosted data: `BLOCKED` (no visible products).
- ShopPage product grid rendering from hosted data: `BLOCKED` (no visible products).
- ProductDetailPage rendering from hosted data: `BLOCKED` (no visible products to navigate).
- Media URL resolution with hosted product media: `BLOCKED` (no visible products).
- Loading state explicit UI: `VERIFIED` (skeleton states present in product-flow pages/components).
- Empty state explicit UI: `VERIFIED` (empty states present in Home/Shop/Product Rail/Build picker overlays).
- Error state explicit UI: `VERIFIED` (error states present with retry handlers in product-flow pages/components).
- Visible/published-only products: `VERIFIED BY CODE` (`is_visible=true` enforced in list/detail queries).

## 6) Required Next Step (To Unblock)

Apply or re-apply demo seed SQL to hosted Supabase project:
- `backend/supabase/seed/001_spec_definitions.sql`
- `backend/supabase/seed/002_admin_bootstrap.sql`
- `backend/supabase/seed/003_demo_products.sql`

Post-seed acceptance check:
- Re-run hosted anon check for `is_visible=true` products and require `VISIBLE_COUNT > 0`.

Only after that, continue Product Flow runtime verification.