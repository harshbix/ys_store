# AUTH Runtime Trace

Date: 2026-04-07
Scope: customer register/login/session/logout/protected routes only

## Verified Runtime Path (Actual)

### Signup (frontend direct to Supabase)
- UI source: frontend/src/pages/RegisterPage.tsx
- Hook source: frontend/src/hooks/useAuth.ts
- API source: frontend/src/api/auth.ts -> registerWithPassword
- Request payload from form to hook:
  - fullName, inputEmail, password
- Supabase signup call shape:
  - supabase.auth.signUp({ email, password, options: { data: { full_name } } })
- Frontend expected success payload:
  - { access_token, customer_id, challenge_id }
- Frontend storage write on success:
  - localStorage key ys-customer-auth via useAuthStore.completeLogin
  - localStorage key sb-<project>-auth-token via Supabase client
- Redirect behavior on authenticated state:
  - RegisterPage useEffect -> /shop

### Login (frontend direct to Supabase)
- UI source: frontend/src/pages/LoginPage.tsx
- Hook source: frontend/src/hooks/useAuth.ts
- API source: frontend/src/api/auth.ts -> loginWithPassword
- Request payload from form to hook:
  - inputEmail, password
- Supabase login call shape:
  - supabase.auth.signInWithPassword({ email, password })
- Frontend expected success payload:
  - { access_token, customer_id, challenge_id }
- Frontend storage write on success:
  - ys-customer-auth store
  - Supabase auth token storage
- Redirect behavior on authenticated state:
  - LoginPage useEffect -> returnTo or /shop

### Session Persistence
- Store source: frontend/src/store/auth.ts (zustand persist)
- Supabase source: frontend/src/lib/supabase.ts (persistSession true)
- Persistence path:
  - ys-customer-auth kept in localStorage
  - sb-<project>-auth-token kept in localStorage
- Verified refresh behavior:
  - logged-in user remained logged in and stayed on protected route

### Logout
- Header source: frontend/src/components/layout/Header.tsx
- Hook source: frontend/src/hooks/useAuth.ts
- Current behavior after fix:
  - calls supabase.auth.signOut()
  - clears ys-customer-auth store
  - invalidates auth/cart queries
  - redirects to /login
- Verified storage after logout:
  - ys-customer-auth => null state
  - sb-<project>-auth-token => removed (null)

### Protected Routes (customer)
- Router source: frontend/src/router/index.tsx
- Guard source: RequireCustomer
- Guarded routes:
  - /cart
  - /wishlist
  - /checkout
- Redirect when signed out:
  - /login with returnTo state

## Backend Auth Contract (Implemented, not current frontend login source)
- Route file: backend/src/modules/auth/routes.js
- Register endpoint:
  - POST /api/auth/register
  - expects body { full_name, email, password }
  - returns envelope { success, message, data: { access_token, customer_id, challenge_id } }
- Login endpoint:
  - POST /api/auth/login
  - expects body { email, password }
  - returns envelope { success, message, data: { access_token, customer_id, challenge_id } }
- Validators:
  - backend/src/modules/auth/validator.js

## Error Mapping and UX Path
- Normalization source: frontend/src/lib/errors.ts
- User-facing mapping source: frontend/src/utils/errors.ts
- Verified mappings used in UI:
  - invalid_credentials/login_failed -> Wrong email or password
  - user_already_* -> account already exists guidance
  - email_not_confirmed/email_verification_required -> verify email guidance
  - over_email_send_rate_limit/register_failed (429) -> throttle guidance
  - invalid email / weak password -> plain-English guidance

## Layer Classification (A-G)
- A frontend form/validation bug: not observed in current runtime checks
- B frontend request shape bug: not observed for customer login/signup payloads
- C backend validation/controller bug: not blocking current runtime because frontend uses direct Supabase auth path
- D backend Supabase integration bug: not blocking current runtime login/signup path
- E provider/dashboard limitation: observed (429 over_email_send_rate_limit on signup)
- F session persistence bug: fixed logout hygiene issue (Supabase token persisted after logout)
- G logout/protected-route bug: fixed (wishlist/checkout were accessible when signed out)

## Evidence Snapshot (Runtime)
- Wrong password login:
  - status 400
  - response {"code":"invalid_credentials","message":"Invalid login credentials"}
  - UI shows mapped plain-English message
- Login success with confirmed account:
  - status 200
  - redirect to /shop
- Session persistence:
  - refresh preserved authenticated route
- Logout:
  - redirected to /login
  - ys-customer-auth cleared
  - sb auth token removed
- Protected routes while signed out:
  - /cart -> /login
  - /wishlist -> /login
  - /checkout -> /login
- Signup attempt:
  - status 429
  - response {"code":"over_email_send_rate_limit","message":"email rate limit exceeded"}
  - throttle guidance shown in UI
