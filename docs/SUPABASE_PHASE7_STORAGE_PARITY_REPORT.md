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
- [ ] Execute scripts against target Supabase environment.
- [ ] Review generated audit report and remediate non-canonical URLs if any.
- [ ] Re-run admin media upload/finalize flow test after remediation.

## Notes

This phase introduces operational tooling only and does not change frontend contract payload shapes.
