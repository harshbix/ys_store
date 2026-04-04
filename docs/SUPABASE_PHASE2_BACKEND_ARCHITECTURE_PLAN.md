# YS Store Phase 2
## New Backend Compatibility Layer Architecture Plan

Date: 2026-04-04
Depends on:
- docs/SUPABASE_BACKEND_PHASE0_AUDIT.md
- docs/SUPABASE_PHASE1_SCHEMA_MIGRATION_PLAN.md

Scope:
- Architecture and implementation plan for the new backend-for-frontend layer.
- No frontend redesign.
- API contract compatibility is the primary objective.

## 1) Architecture Objective

Build a thin, production-safe backend that keeps the current frontend behavior unchanged while using Supabase for persistence, auth foundation, and storage.

Primary principle:
- Contract compatibility over architectural purity.

## 2) Technology Choice

Chosen approach for lowest migration risk:
- Node.js
- Express
- TypeScript (strict)
- Zod validation
- Supabase server client
- Structured logging (pino or equivalent)

Rationale:
- Existing backend is Express and route semantics are already stable.
- TypeScript adds safety without changing HTTP contract.
- Keeping Express minimizes behavioral drift and deployment risk.

## 3) Proposed Service Layout

Target project structure:
- src/app
- src/config
- src/lib
- src/middleware
- src/routes
- src/controllers
- src/services
- src/repositories
- src/validators
- src/types
- src/contracts
- src/observability

Core design:
- routes: endpoint binding only.
- validators: request schema only.
- controllers: request/response orchestration.
- services: business logic and transaction boundaries.
- repositories: pure data access (Supabase/Postgres).
- contracts: response mappers preserving existing frontend envelopes.

## 4) Compatibility Contract Layer

Mandatory contract adapter behavior:
- Every endpoint returns existing envelope shape:
  - success, message, data for success
  - success, error_code, message, details for failures
- No raw Supabase response passthrough to client.
- Null/default behavior preserved exactly.

Contract-safe error strategy:
- Domain errors mapped to existing error_code taxonomy from current backend.
- Internal errors redacted in production (no stack traces to UI).
- request_id included in details where currently expected.

## 5) Middleware Plan

Core middleware stack:
- requestContext (request_id propagation)
- helmet + secure CORS allowlist
- cookie parser
- JSON body parser with payload limits
- validation middleware (zod)
- guest session middleware (cookie-first compatibility)
- auth middleware:
  - requireCustomerAuth
  - requireAdmin
- idempotency middleware (quote flow)
- rate limiters (OTP, quote, admin login)
- centralized error handler

Compatibility requirement:
- Keep guest-session behavior backward compatible:
  - continue cookie-driven identity now
  - tolerate x-guest-session header during transition

## 6) Module Implementation Plan

### 6.1 Products module

Read endpoints first:
- GET /api/products
- GET /api/products/:slug

Rules:
- Preserve filtering semantics and query param coercion.
- Preserve pagination defaults and sorting.
- Preserve response fields currently consumed by frontend.

### 6.2 Cart module

Session-sensitive:
- GET /api/cart
- POST /api/cart/items
- PATCH /api/cart/items/:itemId
- DELETE /api/cart/items/:itemId

Rules:
- Preserve cart creation-on-read behavior.
- Preserve line price/title snapshot behavior.
- Add server-side ownership checks without changing response shape.

### 6.3 Builds module

Endpoints:
- POST /api/builds
- GET /api/builds/:buildId
- PATCH /api/builds/:buildId/items
- DELETE /api/builds/:buildId/items/:itemId
- POST /api/builds/:buildId/validate
- POST /api/builds/:buildId/add-to-cart

Rules:
- Preserve compatibility payload contract.
- Preserve auto-replacement messaging semantics.

### 6.4 Quotes module (highest sensitivity)

Endpoints:
- POST /api/quotes
- GET /api/quotes/:quoteCode
- POST /api/quotes/:quoteCode/whatsapp-click
- GET /api/quotes/:quoteCode/whatsapp-url

Rules:
- Preserve quote_code format.
- Preserve idempotency semantics.
- Preserve whatsapp_url generation format.
- Preserve status transitions and click tracking behavior.

### 6.5 Auth module

Endpoints:
- POST /api/auth/request-otp
- POST /api/auth/verify-otp
- wishlist and persistent cart sync endpoints

Rules:
- Preserve token payload fields expected by frontend.
- Preserve post-login guest cart merge behavior.

### 6.6 Admin and Media modules

Endpoints:
- admin login/me/products/quotes
- media signed upload/finalize/shop media

Rules:
- Preserve admin UX flow and dashboard assumptions.
- Keep upload signed-url flow stable.

## 7) Transaction And Consistency Strategy

Transactional boundaries:
- Quote creation remains transactional via RPC.
- Build validation and replacement updates are atomic service operations.
- Multi-step cart merge operations wrapped in transaction-safe logic.

Preferred mechanisms:
- Postgres transaction blocks or RPC for multi-table writes.
- Idempotency at DB unique key + middleware key derivation.

## 8) Security Model

Non-negotiables:
- Service role key never sent to frontend.
- Admin authorization enforced server-side only.
- Customer authorization enforced server-side only.
- Request validation for every write path.
- Ownership checks for cart/build/quote mutations.
- RLS used as defense-in-depth.

## 9) Observability And Operations

Required observability:
- structured request logs (method, path, status, latency, request_id)
- domain error logs with error_code
- key mutation failure logs
- latency logs for products/cart/quotes/admin

Runtime endpoints:
- /health and /api/health preserved.

Operational docs:
- deployment variables matrix
- rollback runbook
- parity validation runbook

## 10) Deployment Topology

Recommended topology:
- Keep frontend on current hosting.
- Deploy new compatibility backend on low-cost host (Railway/Fly/Render).
- Backend connects to Supabase project using server credentials.

Cutover safety:
- Frontend switches API base by VITE_API_URL only.
- Old backend remains running during validation window.
- Instant rollback by restoring old API URL.

## 11) Implementation Order (Strict)

1. Backend TypeScript skeleton and baseline middleware.
2. Read endpoints parity (products/cart/build read/admin read/quote read).
3. Read parity tests against current behavior.
4. Auth/session compatibility hardening.
5. Write endpoints parity (cart/build/admin).
6. Quote/WhatsApp parity completion.
7. Storage/admin media parity.
8. Full end-to-end and rollback drills.

## 12) Test Strategy For Parity

Contract tests per endpoint:
- status code parity
- envelope shape parity
- key field parity
- pagination/filter parity

Flow tests:
- browse -> cart -> checkout quote -> WhatsApp click
- builder -> validate -> add to cart -> quote
- customer login and cart sync
- admin login -> product edit -> media upload

Performance checks:
- product list/filter latency
- cart read latency
- quote creation latency
- admin products listing latency

## 13) Phase 2 Output Summary

What changed in this phase:
- A complete backend compatibility architecture was defined.
- Module boundaries, middleware, error handling, transactions, and deployment strategy were specified.

What is preserved:
- Existing frontend contract and behavioral assumptions remain central.

Remaining risks:
- Session compatibility drift if header vs cookie identity handling is changed too early.
- Quote and WhatsApp formatting drift in refactor.
- Admin upload contract drift during storage hardening.

How parity is tested in this phase:
- Contract-level and flow-level parity test plan defined and staged before write-path cutover.