# ys_store
this is the comprehensive e commerce website for ys store

## Current App Status

For a clear, up-to-date list of what the app can do and cannot do yet, see:

- [docs/APP_CAPABILITIES_AND_LIMITATIONS.md](docs/APP_CAPABILITIES_AND_LIMITATIONS.md)

Security note: do not store credentials in this repository. Use environment variables and a local .env file that is git-ignored.

## Frontend to Backend Connection

Set the backend API URL in your frontend environment:

- `VITE_API_URL=https://your-backend-domain.com/api`

If your backend is exposed without an `/api` prefix, use:

- `VITE_API_URL=https://your-backend-domain.com`

After changing environment variables, trigger a redeploy so the new value is applied at build time.

## Backend CORS

Set `FRONTEND_URL` in backend env as a comma-separated allowlist. Example:

- `FRONTEND_URL=http://localhost:5173,http://localhost:5174,https://your-frontend-domain.com`

In production, guest-session cookies are configured for cross-domain usage (`SameSite=None` and `Secure=true`), so frontend and backend must both be served over HTTPS.

## Frontend Validation

Run frontend API client scenario tests:

- `cd frontend && npm test`

## Demo Product Seed

To populate a testing catalog for cart and wishlist flows, run these seed files in order:

- `backend/supabase/seed/001_spec_definitions.sql`
- `backend/supabase/seed/002_admin_bootstrap.sql`
- `backend/supabase/seed/003_demo_products.sql`

The demo catalog includes desktops, laptops, components, and accessories with product specs and media rows.

## Customer Authentication

Customer login is password-first (`/auth/login`) with registration via `/auth/register`.

OTP endpoints (`/auth/request-otp`, `/auth/verify-otp`) remain available for compatibility and operational fallback paths.