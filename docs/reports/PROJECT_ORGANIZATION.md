# Project Organization Guide

## Overview

This project is organized into logical sections for development, testing, and deployment.

## 📁 Directory Structure

### Root Level (Quick Reference)
- **README.md** - Project overview
- **DEPLOY_CHECKLIST.md** - Quick deployment checklist (your 8-point validation)
- **PRODUCTION_READINESS_REPORT.md** - Current production status
- **BUILD_SPEC_V1_2.md** - Build specifications

### `/backend` - Backend & Database
```
backend/
├── supabase/
│   ├── migrations/              # Database migrations (001-015)
│   │   ├── 001-011_*.sql       # Foundation & RLS (deployed ✅)
│   │   └── 012-015_*.sql       # RPC functions (deployed ✅)
│   └── seed/                    # Database seeding scripts
├── tests/                       # SQL test suite (NEW)
│   ├── README.md               # Test documentation
│   ├── RPC_RUNTIME_TESTS.sql   # 10 SQL tests
│   └── VERIFY_RPC_FUNCTIONS.sql # Function verification
├── scripts/
│   └── storage/                # Storage-related scripts
└── package.json

Run: npx supabase db push
Test: Run SQL files in `backend/tests/`
```

### `/frontend` - Frontend Application
```
frontend/
├── src/
│   ├── api/                    # RPC API clients
│   │   ├── cart.ts             # Cart RPC calls
│   │   ├── builds.ts           # Build RPC calls
│   │   ├── quotes.ts           # Quote RPC calls
│   │   └── products.ts         # Product queries
│   ├── components/             # React components
│   ├── pages/                  # Route pages
│   └── lib/
│       └── supabase.ts         # Supabase client init
├── RPC_RUNTIME_TESTS.ts        # 11 TypeScript/Vitest tests (NEW)
├── package.json
├── vite.config.ts
└── tsconfig.json

Run: npm run dev
Test: npx vitest run RPC_RUNTIME_TESTS.ts
```

### `/docs` - Documentation
```
docs/
├── rpc-deployment/             # RPC-specific docs (NEW)
│   ├── README.md               # Navigation & overview
│   ├── RPC_DEPLOYMENT_GUIDE.md # Step-by-step deployment
│   ├── RPC_MONITORING_GUIDE.md # Monitoring & troubleshooting
│   └── RPC_VALIDATION_REPORT.md # Pre-deployment validation
└── [existing docs]
    ├── APP_CAPABILITIES_AND_LIMITATIONS.md
    ├── CUTOVER_DECISION_SUMMARY.md
    ├── PARITY_FINAL_VERIFICATION_REPORT.md
    └── ...
```

## 🎯 Quick Navigation

### 🚀 I want to deploy RPC functions
→ Read: `docs/rpc-deployment/RPC_DEPLOYMENT_GUIDE.md`

### ✅ I want to validate the system
→ Use: `DEPLOY_CHECKLIST.md` (your 8-point checklist)

### 🧪 I want to run tests
```bash
# SQL tests (in Supabase)
See: docs/rpc-deployment/RPC_DEPLOYMENT_GUIDE.md - Phase 2

# Frontend tests (in TypeScript)
cd frontend && npx vitest run RPC_RUNTIME_TESTS.ts

# Verify functions exist
See: backend/tests/VERIFY_RPC_FUNCTIONS.sql
```

### 🔧 I need to troubleshoot
→ Read: `docs/rpc-deployment/RPC_MONITORING_GUIDE.md`

### 📊 I want to check production readiness
→ Read: `PRODUCTION_READINESS_REPORT.md`

## 🔄 Development Workflow

### When Making Changes

```
1. Make code changes
   └─ API layer: frontend/src/api/*.ts
   └─ RPC layer: backend/supabase/migrations/01x_*.sql
   └─ Components: frontend/src/components/**

2. Test locally
   └─ backend: npm run dev (Supabase local)
   └─ frontend: npm run dev (Vite dev server)

3. Run test suites
   └─ SQL: Run backend/tests/RPC_RUNTIME_TESTS.sql
   └─ Frontend: npx vitest run RPC_RUNTIME_TESTS.ts
   └─ Manual: Test scenarios from Phase 4

4. Deploy
   └─ backend: npx supabase db push
   └─ frontend: npm run build (then deploy to Vercel)

5. Validate
   └─ Run DEPLOY_CHECKLIST.md (all 8 points)
   └─ Monitor: docs/rpc-deployment/RPC_MONITORING_GUIDE.md
```

## 📋 Testing Strategy

### Level 1: SQL Tests (Direct RPC)
- **Location**: `backend/tests/RPC_RUNTIME_TESTS.sql`
- **Tests**: 10 test cases
- **Scope**: Direct PostgreSQL RPC execution
- **How**: Copy-paste into Supabase SQL Editor

### Level 2: Frontend Tests (Integration)
- **Location**: `frontend/RPC_RUNTIME_TESTS.ts`
- **Tests**: 11 test cases
- **Scope**: TypeScript/Supabase client integration
- **How**: `cd frontend && npx vitest run RPC_RUNTIME_TESTS.ts`

### Level 3: Manual Tests (E2E)
- **Location**: `docs/rpc-deployment/RPC_DEPLOYMENT_GUIDE.md` - Phase 4
- **Tests**: 5 user scenarios
- **Scope**: Real browser, real user flows
- **How**: Follow step-by-step guides

**Total Coverage**: 26+ test cases across all levels

## 🎓 Key Concepts

### RPC Functions (15 total)
Business logic lives in PostgreSQL, not in Node.js. Frontend calls RPC via Supabase client.

**Benefits:**
- ✅ Atomic transactions at database level
- ✅ Validated inputs server-side
- ✅ Calculated totals always correct
- ✅ Can run without REST API backend

**Location**: `backend/supabase/migrations/012-015_*.sql`

### Row-Level Security (RLS)
Enforces data isolation at database layer.

- Guest carts: isolated by `session_token`
- Auth carts: isolated by `auth.uid()`
- No cross-user data access possible

**Policies**: Defined in migration 010

### Session Management
Two user types with different session patterns:

**Guests** (no login):
- Stored: `localStorage['ys-guest-session']` (UUID)
- Passed to: Every RPC call as `p_session_token`

**Authenticated** (logged in):
- Stored: Supabase auth session
- Passed to: RPC as `p_customer_auth_id` (user ID)

### Idempotency
Quote creation prevents duplicates via `idempotency_key`.

Same key + Same input = Same output (same quote ID)

**Mechanism**: Unique index on `idempotency_key` with `ON CONFLICT`

## 🚦 Status

### Deployment Status
| Component | Status | Evidence |
|-----------|--------|----------|
| Migrations 001-011 | ✅ Deployed | Migration history aligned |
| Migrations 012-015 | ✅ Deployed | 15 RPC functions verified |
| RLS Policies | ✅ Active | Session-based filtering |
| Frontend Migration | ✅ Complete | All APIs use RPC |

### Test Status
| Test Suite | Status | Result |
|-----------|--------|--------|
| SQL Tests | ⏳ Ready | 10/10 pending verification |
| Frontend Tests | ⏳ Ready | 11/11 pending verification |
| Manual Tests | ⏳ Ready | 5/5 pending verification |

### Production Readiness
| Requirement | Status |
|-----------|--------|
| [1] All 4 migrations deployed | ✅ PASS |
| [2] RPC_RUNTIME_TESTS.sql → 10/10 | ⏳ Pending |
| [3] RPC_RUNTIME_TESTS.ts → all pass | ⏳ Pending |
| [4] Manual scenarios → all pass | ⏳ Pending |
| [5] No RLS errors in console | ⏳ Pending |
| [6] No null/undefined data | ⏳ Pending |
| [7] Quote idempotency verified | ⏳ Pending |
| [8] Totals always correct | ⏳ Pending |

## 📝 Important Files

### For Deployment Teams
- `DEPLOY_CHECKLIST.md` - Your checklist
- `PRODUCTION_READINESS_REPORT.md` - Current status
- `docs/rpc-deployment/RPC_DEPLOYMENT_GUIDE.md` - Step-by-step

### For Developers
- `frontend/RPC_RUNTIME_TESTS.ts` - TypeScript tests
- `backend/supabase/migrations/` - Migration source
- `frontend/src/api/*.ts` - RPC client code

### For DevOps/SRE
- `docs/rpc-deployment/RPC_MONITORING_GUIDE.md` - Monitoring setup
- `backend/tests/VERIFY_RPC_FUNCTIONS.sql` - Health check query
- `PRODUCTION_READINESS_REPORT.md` - Go/No-Go decision

## 🔗 Related Documentation

### Business Context
- `docs/CUTOVER_DECISION_SUMMARY.md` - Why we migrated
- `docs/APP_CAPABILITIES_AND_LIMITATIONS.md` - Feature matrix
- `docs/PARITY_FINAL_VERIFICATION_REPORT.md` - Parity validation

### Technical Details
- `docs/SUPABASE_BACKEND_PHASE0_AUDIT.md` - Schema audit
- `docs/SUPABASE_PHASE*.md` - Migration phase reports

## ❓ Need Help?

### Setup & Deployment Issues
→ `docs/rpc-deployment/RPC_DEPLOYMENT_GUIDE.md`

### Troubleshooting Runtime Errors
→ `docs/rpc-deployment/RPC_MONITORING_GUIDE.md` - Error Patterns section

### Understanding the Architecture
→ `docs/rpc-deployment/README.md` - Concepts section

### Test Coverage Questions
→ `backend/tests/README.md` or `docs/rpc-deployment/README.md`

---

**Last Updated**: April 6, 2026  
**Maintenance**: Keep directory structure as documented  
**Next Steps**: Complete your 8-point validation checklist
