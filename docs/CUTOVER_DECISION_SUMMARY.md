# YS Store Cutover Decision Summary

Date: 2026-04-05
Decision: **CONDITIONAL GO**

## Decision Basis

Cutover criteria evidence in this workspace now shows required behavioral parity and operational safety for release:
- Real browser parity suite is passing for all required personas and critical journeys (guest, admin, customer).
- Storage canonicalization blocker is resolved and latest audit reports zero non-canonical media URL issues.
- Access-control/ownership behavior is validated across guest/customer/admin scenarios.
- Rollback remains immediate by switching frontend API base URL back to the prior backend endpoint.

The remaining legacy-vs-new latency comparison is classified as a **non-blocking evidence gap** in the current cutover state because the legacy runtime target needed for side-by-side measurement is not available.

## Resolved Blockers

1. Storage canonicalization resolved.
- Evidence: `backend/reports/storage-normalization-1775339633196.json`
- Verification: `backend/reports/storage-audit-1775341385136.json` (`rows_with_issues: 0`)

2. Customer browser E2E resolved.
- Flow verified end-to-end: request OTP, verify OTP, auth persistence across reload, wishlist add/remove, persistent cart sync across reload, logout.
- Evidence source: Playwright parity suite in `frontend/e2e/parity.verify.spec.ts`

3. Full parity suite passing.
- Guest/admin/customer parity suite result: 3 passed.

## Remaining Risks

1. Legacy-vs-new p50/p95 side-by-side latency table is still missing.
- Risk type: evidence completeness risk (not a functional parity failure).
- Mitigation: post-cutover latency monitoring and completion of side-by-side benchmark once legacy endpoint is available.

2. Runtime performance variability risk.
- Current backend latency sample exists, but no direct old-vs-new delta can be computed without legacy baseline target.

## Rollback Readiness

Rollback status: **Ready**
- Method: revert frontend API base URL (`VITE_API_URL`) to previous backend endpoint.
- Expected impact: immediate traffic return to prior backend runtime without schema rollback for this cutover decision path.

## Why Legacy Latency Comparison Is Still Unavailable

Exact reason:
- No reachable legacy backend runtime endpoint/configuration is available in this workspace/session (no usable `LEGACY_*` runtime URL or equivalent baseline target), so a valid side-by-side old-vs-new latency comparison cannot be executed without fabricating baseline data.

## Final Recommendation

Proceed with release as **CONDITIONAL GO**, with a tracked action to complete the legacy-vs-new latency delta report immediately after legacy runtime access is provided.
