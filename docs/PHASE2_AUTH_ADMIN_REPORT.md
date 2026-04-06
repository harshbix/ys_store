# Phase 2 Auth/Admin Verification Report

Date: 2026-04-06
Scope: customer auth, admin auth, admin product posting, storefront visibility, targeted UX/error handling

## Summary

Phase 2 app flows are working in runtime with one external caveat:
- Customer signup is currently rate-limited by Supabase provider (`429 over_email_send_rate_limit`).
- Customer login/logout/session persistence are verified through actual UI using a confirmed existing account path.
- Admin login/dashboard/product posting/storefront visibility are verified through actual UI.

## Corrected Status Matrix

- Admin bootstrap in `admin_users`: PASS (already present; not a blocker)
- Admin auth (login + `/me`): PASS
- Admin product posting (UI): PASS
- Storefront visibility after admin post (UI): PASS
- Customer register request contract (frontend -> backend -> provider): PASS
- Customer register execution: PASS WITH OPERATIONAL CAVEAT (provider rate limit)
- Customer login/session (existing confirmed account): PASS

## Evidence Highlights

### 1. Customer register provider limit (operational)
- Runtime request: `POST https://kzpknqwlecicildibiqt.supabase.co/auth/v1/signup`
- Response: `429`
- Provider code/message: `over_email_send_rate_limit`, `email rate limit exceeded`
- UI message verified: `Too many signup attempts right now. Please wait and try again.`

### 2. Customer login/logout/session UI
- Login via `/login` succeeded (`200`) for confirmed existing account path.
- `ys-customer-auth` state persisted after page reload.
- Logout via header `Sign out` cleared auth state and redirected to `/login`.
- Protected customer route `/cart` redirected to `/login` when unauthenticated.

### 3. Admin UI flow
- Admin login page (`/admin/login`) succeeded against backend route.
- Dashboard loaded.
- Product post from dashboard succeeded (`201`).
- Created product is visible and fetchable in dashboard edit flow.
- Posted visible product appeared in storefront `/shop`.

## Code vs Operational Classification

### App-code fixes applied
1. Register UX mapping for provider rate-limit errors.
2. Customer logout action exposed in main header.
3. Admin frontend client aligned to backend admin routes.
4. Local frontend API URL corrected to backend port `4000`.

### Operational/provider caveat (not app-code failure)
- Supabase signup email rate limiting currently blocks fresh customer registration attempts.

## Decision

Phase 2 status: GO with operational caveat.
- App logic for customer login/session, admin auth, admin posting, and storefront visibility is verified.
- Fresh signup remains temporarily constrained by external provider rate-limit policy.
