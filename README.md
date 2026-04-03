# ys_store
this is the comprehensive e commerce website for ys store

Security note: do not store credentials in this repository. Use environment variables and a local .env file that is git-ignored.

## Frontend to Backend Connection

Frontend is deployed on Vercel and backend is deployed on Render.

Required Vercel environment variable:

- `VITE_API_URL=https://ys-store-h1ec.onrender.com/api`

If your backend is exposed without an `/api` prefix, use:

- `VITE_API_URL=https://ys-store-h1ec.onrender.com`

After changing Vercel environment variables, trigger a redeploy so the new value is applied at build time.

## Backend CORS

Set `FRONTEND_URL` in backend env as a comma-separated allowlist. Example:

- `FRONTEND_URL=http://localhost:5173,https://your-vercel-domain.vercel.app`

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

Customer login now uses email OTP (`/auth/request-otp` and `/auth/verify-otp`) instead of phone OTP.