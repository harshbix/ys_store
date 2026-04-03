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