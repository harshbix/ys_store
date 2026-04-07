# ys_store
this is the comprehensive e commerce website for ys store

## Current App Status

For a clear, up-to-date list of what the app can do and cannot do yet, see:

- [docs/APP_CAPABILITIES_AND_LIMITATIONS.md](docs/APP_CAPABILITIES_AND_LIMITATIONS.md)

Security note: do not store credentials in this repository. Use environment variables and a local .env file that is git-ignored.

## Frontend to Backend Connection

Production first:

- `VITE_API_URL=https://<your-backend-domain>/api`
- `FRONTEND_URL=https://ysstore.vercel.app`
- `SUPABASE_URL=https://<your-project-ref>.supabase.co`

If your backend is exposed without an `/api` prefix, use:

- `VITE_API_URL=https://<your-backend-domain>`

Use localhost values only for local development:

- `VITE_API_URL=http://localhost:4000/api`
- `FRONTEND_URL=http://localhost:5173`

After changing environment variables, trigger a redeploy so the new value is applied at build time.

## Backend CORS

Set `FRONTEND_URL` in backend env as a comma-separated allowlist. Production should be listed first:

- `FRONTEND_URL=https://ysstore.vercel.app,https://<preview-domain>,http://localhost:5173,http://localhost:5174`

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

Customer login is Google-first in the frontend experience.

Password and OTP endpoints remain available in the backend for compatibility and fallback paths, but the primary customer path is Google OAuth.