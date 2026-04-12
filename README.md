# YS Store - PC Builder & E-Commerce Platform

Welcome to the **YS Store**, a full-featured e-commerce platform and custom PC Builder application. 

This repository contains both a modern React-based frontend and a robust Node.js backend API built around a Supabase PostgreSQL database. It features product browsing, cart and checkout systems, a custom PC builder logic, and an integrated WhatsApp ordering flow.

## 🏗️ Tech Stack

### Frontend
- **React 18** (Vite powered)
- **TypeScript**
- **Tailwind CSS** (Styling & Design System)
- **Zustand** (Global state management)
- **React Query** (Server state and caching)
- **React Router v6** (Navigation)
- **Lucide React** (Icons)
- **Framer Motion** (Animations)

### Backend
- **Node.js / Express** (REST API)
- **Supabase** (PostgreSQL Database, Auth, Storage)
- **Zod** (Validation)

## 📂 Project Structure

```text
ys_store/
├── backend/
│   ├── src/        # Express app, Routes, Controllers
│   ├── supabase/   # Database architecture, migrations, and schema
│   ├── scripts/    # Utility and database validation scripts
│   └── tests/      # Backend tests
├── frontend/
│   ├── src/        # React source code (components, pages, hooks, api)
│   ├── scripts/    # Build and optimization scripts
│   └── public/     # Static assets
└── docs/
    └── reports/    # Historical documentation and deployment reports
```

## 🚀 Setup Instructions

### Environment Variables
Both the backend and frontend rely on `.env` settings to function properly.
Do **not** commit these files.

**Backend (`backend/.env`):**
```env
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_STORAGE_BUCKET=media
ADMIN_JWT_SECRET=your_admin_jwt_secret
```

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WHATSAPP_NUMBER=your_whatsapp_number
```

### Starting the Services

**1. Start the Backend API:**
```bash
cd backend
npm install
npm run dev
```
*Runs on http://localhost:5000*

**2. Start the Frontend Application:**
```bash
cd frontend
npm install
npm run dev
```
*Runs on http://localhost:5173* (or as output by Vite)

## 🛠 PC Builder System
The core feature of this app is a guided constraints-based **Custom PC Builder**.
It maps real hardware component parts securely from the backend through Supabase RPC methods to calculate combined costs (with fixed build fees) and determines hardware compatibility constraints. Custom builds are assigned an ID in the local session and correctly integrated into the shopping cart for easy checkout mapping.

## 📦 Deployment Steps
1. Push production configurations to your environment secrets (e.g. Vercel / Render).
2. For Frontend (Vercel): ensure `VITE_API_URL` correctly points to the live backend URL, using HTTPS.
3. For Backend (Render/Heroku): Ensure `NODE_ENV=production` and map `SUPABASE_SERVICE_ROLE_KEY` safely.
4. Update `CORS` origins in the backend to allow your production frontend domains.

## 🧪 Testing
- **Frontend Build Validation:** run `npm run build` inside `frontend/` to run a strict TypeScript check and package the application successfully.
- **Backend Build Validation:** run `npm run test` or trigger `node -c src/server.js` checks to validate node integrity.
# ys_store
this is the comprehensive e commerce website for ys store

## Current App Status

For a clear, up-to-date list of what the app can do and cannot do yet, see:

- [docs/APP_CAPABILITIES_AND_LIMITATIONS.md](docs/APP_CAPABILITIES_AND_LIMITATIONS.md)

Security note: do not store credentials in this repository. Use environment variables and a local .env file that is git-ignored.

## Frontend to Backend Connection

Production first:

- `VITE_API_URL=https://<your-backend-domain>/api`
- `FRONTEND_URL=https://ysstoree.com`
- `SUPABASE_URL=https://<your-project-ref>.supabase.co`

If your backend is exposed without an `/api` prefix, use:

- `VITE_API_URL=https://<your-backend-domain>`

Use localhost values only for local development:

- `VITE_API_URL=http://localhost:4000/api`
- `FRONTEND_URL=http://localhost:5173`

After changing environment variables, trigger a redeploy so the new value is applied at build time.

## Backend CORS

Set `FRONTEND_URL` in backend env as a comma-separated allowlist. Production should be listed first:

- `FRONTEND_URL=https://ysstoree.com,https://www.ysstoree.com,https://ysstore.vercel.app,https://<preview-domain>,http://localhost:5173,http://localhost:5174`

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