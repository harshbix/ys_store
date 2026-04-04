# YS Store Phase 1
## Supabase Schema And Migration Plan (Contract-Safe)

Date: 2026-04-04
Depends on: docs/SUPABASE_BACKEND_PHASE0_AUDIT.md
Scope: Supabase foundation hardening only (schema, indexes, RLS policy matrix, storage plan, import and verification runbook).

## 1) Phase Goal

Build a reproducible, migration-file-based Supabase foundation that preserves the existing frontend contract and behavior.

This phase is database/platform-focused and intentionally avoids API contract changes.

## 2) Preservation Rules For This Phase

Contract and UX protections:
- No API envelope changes.
- No endpoint path or method changes.
- No frontend query key changes.
- No cart/build/quote flow behavior changes in this phase.

Schema safety rules:
- Keep all existing column names and enum values used by the current API.
- Avoid removing or renaming any table/column currently selected by backend select("*") queries.
- Additive hardening only (indexes, policies, helper functions, verification artifacts).

## 3) Current Baseline (Already In Repo)

Existing migration baseline:
- 001_enable_extensions.sql
- 002_create_enums.sql
- 003_create_core_tables.sql
- 004_create_support_tables.sql
- 005_create_indexes.sql
- 006_enable_rls_base.sql
- 007_create_quote_transactional_rpc.sql
- 008_fix_quote_rpc_signature.sql

Baseline coverage already present:
- Core tables for products/cart/build/quotes/admin/media/wishlist/analytics.
- Transactional quote RPC with idempotency unique handling.
- RLS enabled on core runtime tables.
- Foundational indexes for most high-traffic paths.

Known baseline gaps to close in Phase 1:
- Missing performance indexes for some contract-critical filters/sorts (brand text search, created_at ordering).
- RLS policies not yet defined (RLS enabled but policy matrix deferred).
- Storage bucket bootstrap/policy setup not codified as source-of-truth migrations.
- Data migration and verification runbook not yet codified.

## 4) Proposed Migration Sequence (Phase 1)

Important: these are proposed migration files to add next, in order.

### 009_enable_pg_trgm_and_search_indexes.sql

Purpose:
- Enable trigram search support for fast ilike contains on brand/cpu/gpu style filters.
- Add missing sort/perf indexes for read-path parity.

Proposed operations:
- create extension if not exists pg_trgm;
- create index if not exists idx_products_created_at_desc on products(created_at desc);
- create index if not exists idx_products_updated_at_desc on products(updated_at desc);
- create index if not exists idx_products_visible_created on products(is_visible, created_at desc);
- create index if not exists idx_products_brand_trgm on products using gin (brand gin_trgm_ops);
- create index if not exists idx_product_specs_cpu_trgm on product_specs using gin (value_text gin_trgm_ops) where spec_key = 'cpu_model';
- create index if not exists idx_product_specs_gpu_trgm on product_specs using gin (value_text gin_trgm_ops) where spec_key = 'gpu_model';

Notes:
- Existing unique index on slug already covers slug lookups.
- Existing unique index on quotes.idempotency_key already covers idempotency retrieval.

### 010_add_missing_session_and_lookup_indexes.sql

Purpose:
- Ensure session/linkage and quote lookup paths remain low-latency at scale.

Proposed operations:
- create index if not exists idx_carts_session_token on carts(session_token);
- create index if not exists idx_quotes_quote_code on quotes(quote_code);
- create index if not exists idx_quotes_idempotency_key on quotes(idempotency_key);
- create index if not exists idx_custom_builds_build_code on custom_builds(build_code);

Notes:
- Some indexes may be redundant with unique constraints; this file should skip duplicates if planner already uses unique indexes effectively.

### 011_define_rls_policy_matrix.sql

Purpose:
- Convert RLS from enabled-only to explicit policy matrix (defense-in-depth).

Approach:
- Keep backend service-role access as primary trusted path.
- Add strict, explicit policies for future client-safe direct access where needed.
- Default deny for tables with no explicit client need.

Policy intent:
- products: public select only where is_visible = true.
- product_specs: public select only where related product is visible.
- product_media: public select only where related product is visible.
- shop_media: public select where is_visible = true.
- wishlists/wishlist_items: authenticated ownership by auth.uid().
- carts/cart_items/custom_builds/custom_build_items:
  - authenticated owner via customer_auth_id = auth.uid();
  - optional guest policies keyed by session claim (for future direct-client usage).
- quotes/quote_items/admin_users/compatibility_rules/analytics_events:
  - no broad public policies in Phase 1.
  - backend service role remains execution path.

### 012_storage_bootstrap_and_policies.sql

Purpose:
- Reproducible bucket setup and object access policies from SQL migrations.

Proposed operations:
- insert bucket (id/name aligned to SUPABASE_STORAGE_BUCKET deployment convention).
- enforce public read policy for published media paths.
- restrict write/update/delete to signed upload flow and trusted server paths.

Notes:
- Keep admin upload flow server-mediated (signed URLs from backend).
- Do not expose service role keys to frontend.

### 013_import_staging_schema.sql

Purpose:
- Create deterministic staging import schema for migration from old backend datastore.

Proposed operations:
- create schema if not exists import_stage;
- create import tables mirroring core entities:
  - import_stage.products
  - import_stage.product_specs
  - import_stage.product_media
  - import_stage.carts
  - import_stage.cart_items
  - import_stage.custom_builds
  - import_stage.custom_build_items
  - import_stage.quotes
  - import_stage.quote_items

### 014_import_merge_upserts.sql

Purpose:
- Deterministic upsert/merge from import_stage into canonical tables.

Merge order:
1. admin_users (if needed)
2. products
3. product_specs
4. product_media
5. carts
6. custom_builds
7. cart_items
8. quotes
9. quote_items
10. analytics_events (optional historical backfill)

Rules:
- Use stable natural keys where available:
  - products by id (or sku/slug fallback if id mapping requires).
  - quotes by id or quote_code.
- Preserve idempotency_key uniqueness.
- Preserve quote_code and whatsapp_message exactly.

### 015_post_import_verification.sql

Purpose:
- Hard validation checks before cutover.

Checks:
- Row counts by table (source vs target).
- Orphan checks for all FKs.
- Duplicate checks for unique domains (slug, sku, quote_code, idempotency_key).
- Null/constraint checks for critical columns.
- Media URL host/path sanity.
- Spot-check quote snapshot integrity (quote_items immutable fields populated).

## 5) Required Index Coverage Matrix

| Required area | Current status | Proposed action |
|---|---|---|
| slug | Covered by unique constraint on products.slug | Keep |
| type | Covered by idx_products_type_stock_visible | Keep |
| brand | Not optimized for ilike contains | Add trigram index |
| condition | Covered by idx_products_condition | Keep |
| price | Covered by idx_products_price | Keep |
| cpu | Basic key/text index exists | Add targeted trigram index on cpu_model value_text |
| gpu | Basic key/text index exists | Add targeted trigram index on gpu_model value_text |
| ram_gb | Covered by spec key+number index | Keep |
| storage_gb | Covered by spec key+number index | Keep |
| stock_status | Covered in composite products index | Keep |
| created_at | No dedicated products created_at index | Add desc index and visible+created composite |
| session linkage | Mostly covered but explicit carts.session_token perf index recommended | Add missing index |
| quote_code | Unique already exists | Keep (explicit check for planner) |
| idempotency_key | Unique already exists | Keep (explicit check for planner) |

## 6) RLS Policy Matrix (Phase 1 Target)

| Table | Public read | Authenticated owner read/write | Admin-only | Backend service role |
|---|---|---|---|---|
| products | Visible only | N/A | N/A | Full |
| product_specs | Only for visible product | N/A | N/A | Full |
| product_media | Only for visible product | N/A | N/A | Full |
| shop_media | is_visible = true | N/A | N/A | Full |
| carts | No broad public (unless session-claim policy) | customer_auth_id = auth.uid() | N/A | Full |
| cart_items | Via cart ownership | Via cart ownership | N/A | Full |
| custom_builds | No broad public (unless session-claim policy) | customer_auth_id = auth.uid() | N/A | Full |
| custom_build_items | Via build ownership | Via build ownership | N/A | Full |
| quotes | No | No broad client write | Admin/backoffice via server | Full |
| quote_items | No | No broad client write | Admin/backoffice via server | Full |
| wishlists | No | customer_auth_id = auth.uid() | N/A | Full |
| wishlist_items | No | Via wishlist ownership | N/A | Full |
| admin_users | No | No | Admin/backoffice via server | Full |
| analytics_events | No broad public | tightly constrained insert only (future) | Admin analytics via server | Full |

## 7) Supabase Storage Plan

Buckets:
- product-media (or existing SUPABASE_STORAGE_BUCKET value)
- optional shop-media (if separating storefront assets from product assets)

Path convention:
- products/{product_id}/{variant}/{timestamp}-{sanitized_name}
- shop/{variant}/{timestamp}-{sanitized_name}

Rules:
- Public read only for finalized/visible media.
- Upload always through signed URLs from backend.
- Finalization writes media rows in DB atomically with path metadata.

## 8) Environment And Secret Plan

Backend required envs (current + phase 1):
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_STORAGE_BUCKET
- ADMIN_JWT_SECRET
- WHATSAPP_PHONE_E164
- FRONTEND_URL (comma-separated allowlist)

Frontend envs:
- VITE_API_URL (active backend compatibility layer)

Operational rules:
- Never expose SUPABASE_SERVICE_ROLE_KEY client-side.
- Use distinct Supabase projects or schemas per environment (dev/staging/prod).
- Keep migration execution in CI/CD pipeline or controlled runbook only.

## 9) Data Migration Execution Plan

1. Freeze write-heavy maintenance window for final import pass.
2. Export old backend data snapshots into CSV/SQL.
3. Load into import_stage.* tables.
4. Execute ordered merge upserts.
5. Run post-import verification SQL.
6. Run backend parity tests and smoke flows.
7. Keep old backend online for rollback during validation window.

## 10) Verification Checklist (Must Pass Before Phase 2 Implementation Moves On)

Schema and constraints:
- All migrations apply cleanly from empty database.
- No missing FK/enum/constraint errors.

Data parity:
- Row counts match expected source totals.
- No orphan rows.
- No duplicate slug/sku/quote_code/idempotency_key.

Performance:
- Product listing and filter queries use expected indexes.
- Explain plans reviewed for:
  - products list default sort newest
  - products brand filter
  - cpu/gpu contains filters
  - cart by session/customer lookup
  - quote by code/idempotency lookup

Security:
- RLS policies exist and are testable.
- Service-role-only operations remain server-side.

## 11) Rollback Plan For Phase 1

If migration or verification fails:
1. Keep old backend active and frontend VITE_API_URL unchanged.
2. Revert to previous migration checkpoint/database snapshot.
3. Fix migration script and rerun in staging.
4. Promote only after staging verification passes.

## 12) Phase 1 Output Summary

What changed in this phase:
- A concrete, ordered schema/migration strategy was defined.
- Required index and RLS policy targets were specified.
- Data import and verification procedures were specified.

What is preserved:
- Existing API contract and frontend behavior expectations remain unchanged.

Remaining risks:
- RLS policy misconfiguration risk.
- Text-search performance risk without trigram coverage.
- Data import mapping risk if legacy source IDs are inconsistent.

How parity is tested in this phase:
- Migration dry-run checks.
- SQL integrity/performance verification checks.
- No runtime contract behavior changes introduced in this planning stage.