# SUPABASE Phase 7 Storage and Admin Media Parity Report

## Scope

Phase 7 focuses on storage/admin media parity while preserving the existing frontend API and UX assumptions.

Objectives:
- Ensure the configured Supabase storage bucket exists and is consistent.
- Audit media URL canonicalization for `product_media` and `shop_media`.
- Keep admin media upload/finalize contract unchanged.

## Changes Implemented

### 1) Storage scripts

Added scripts under `backend/scripts/storage`:
- `ensureBucket.mjs`
  - Verifies the bucket from `SUPABASE_STORAGE_BUCKET` exists.
  - Creates the bucket if it does not exist.
  - Applies image MIME allowlist and a 10MB file-size limit.
- `auditMedia.mjs`
  - Reads `product_media` and `shop_media` rows.
  - Checks `original_url`, `thumb_url`, `full_url` against canonical public URL prefix for the configured bucket.
  - Writes JSON report to `backend/reports/storage-audit-<timestamp>.json`.

### 2) Backend package scripts

Added npm scripts in `backend/package.json`:
- `storage:ensure-bucket`
- `storage:audit-media`

### 3) SQL migrations already staged for this track

- `backend/supabase/migrations/009_add_phase1_perf_indexes.sql`
- `backend/supabase/migrations/010_define_rls_policy_matrix.sql`

## How To Run

From `backend/`:

```bash
npm run storage:ensure-bucket
npm run storage:audit-media
```

Expected behavior:
- `storage:ensure-bucket` prints either "bucket already exists" or "bucket created".
- `storage:audit-media` prints summary and report file path.

## Verification Checklist

- [x] Scripts added for bucket bootstrap and media audit.
- [x] Scripts aligned to existing env vars (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`).
- [x] Execute scripts against target Supabase environment.
- [x] Review generated audit report and identify non-canonical URLs.
- [x] Re-run admin media upload/finalize flow test after script fix.

## Execution Results (2026-04-04)

1. Bucket validation
- Command: `npm run storage:ensure-bucket`
- Result: bucket already exists (`media`).

2. Media audit runtime fix
- Initial `storage:audit-media` run failed because `shop_media` was queried with `product_id` in the select list.
- Script was fixed to use table-specific column selections:
  - `product_media`: `id,product_id,original_url,thumb_url,full_url`
  - `shop_media`: `id,original_url,thumb_url,full_url`

3. Media audit final run
- Command: `npm run storage:audit-media`
- Result summary:
  - `total_product_media_rows`: 22
  - `total_shop_media_rows`: 0
  - `rows_with_issues`: 8
- Report: `backend/reports/storage-audit-1775337342697.json`

4. Real admin upload verification
- Frontend parity E2E confirms `/api/media/admin/upload-url` and `/api/media/admin/upload/finalize` execute successfully and storefront renders uploaded media URL from Supabase storage public path.

## Notes

Remaining remediation work from audit report:
- 8 `product_media` rows still point at external placeholder URLs (`picsum.photos`) instead of canonical Supabase bucket public URLs.
- This does not break runtime contracts but should be normalized before strict production cutover.
