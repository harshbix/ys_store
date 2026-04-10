# Admin Authentication System - Complete Implementation Summary

## Overview
Converted admin authentication from Supabase OAuth-based to a clean email/password backend JWT system while maintaining customer authentication through Google OAuth.

## Files Changed

### Backend Changes

#### 1. **backend/supabase/migrations/021_add_admin_password_hash.sql** (NEW)
- Adds `password_hash` column to `admin_users` table for storing hashed passwords
- Adds `auth_method` column to track authentication type ('password' or 'oauth')
- Enables secure password-based admin login

#### 2. **backend/src/utils/password.js** (NEW)
- Implements PBKDF2-based password hashing with 100,000 iterations
- `hashPassword()`: Generates secure password hashes with random salt
- `verifyPassword()`: Verifies passwords using timing-safe comparison
- Prevents timing attacks through constant-time comparison

#### 3. **backend/src/middleware/adminAuth.js** (MODIFIED)
**Before:** Used `supabase.auth.getUser(token)` to verify Supabase OAuth tokens
**After:** Verifies backend JWT using `jwt.verify()` with `ADMIN_JWT_SECRET`
- Extracts token from `Authorization: Bearer <token>` header
- Verifies JWT signature and payload
- Checks admin record exists and is active in database
- Returns 401 for invalid/expired tokens
- Returns 403 for unauthorized admins
- NO longer depends on Supabase OAuth for admin auth

#### 4. **backend/src/modules/admin/service.js** (MODIFIED)
**Before:** Compared email/password against single env vars only
**After:** Supports multiple allowed admin emails with secure password verification
- Accepts email and password parameters
- Validates email is in `env.allowedAdminEmails` list
- Looks up admin record from database
- Verifies password hash using `verifyPassword()`
- Returns backend JWT token (not Supabase token)
- Clear separation: admin auth ≠ customer auth

#### 5. **backend/src/config/env.js** (MODIFIED)
- Added `allowedAdminEmails` config property
- Parses `ADMIN_EMAIL` env var as comma-separated list
- Converts to array of lowercase emails for comparison
- Legacy vars kept for backward compatibility but not used in new flow
- Environment variables used:
  - `ADMIN_EMAIL` - comma-separated allowed admin emails (e.g., "kidabixson@gmail.com,yusuphshitambala@gmail.com")
  - `ADMIN_JWT_SECRET` - secret for signing JWTs
  - `ADMIN_JWT_EXPIRES_IN` - token expiry (default: 7d)

#### 6. **backend/scripts/generate-admin-password-hashes.mjs** (NEW)
- Command-line tool to generate password hashes for admin setup
- Usage: `node backend/scripts/generate-admin-password-hashes.mjs`
- Outputs SQL UPDATE statements for populating password_hash
- ⚠️ Each run generates different hashes (random salt) - save the output

#### 7. **backend/supabase/seed/admin_users_setup.sql** (NEW)
- SQL template for seeding admin_users with required fields
- Creates or updates entries for the two allowed admin emails
- Requires password_hash values to be populated via Node script

### Frontend Changes

#### 8. **frontend/src/api/admin.ts** (MODIFIED)
**Before:** Called `supabase.auth.signInWithPassword()` then tried to get `/admin/me` with Supabase token
**After:** Direct POST to backend `/api/admin/login` endpoint
- New `adminLogin(email, password)` function
- POSTs directly to `POST /api/admin/login` endpoint
- Returns backend JWT token (not Supabase token)
- Returns admin user payload
- Backend handles all password verification
- No Supabase OAuth involved in admin login

#### 9. **frontend/src/pages/AdminLoginPage.tsx** (REWRITTEN)
**Before:** Single button for "Continue with Google (Admin)"
**After:** Full email/password form
- Email input field with validation
- Password input field with validation
- Submit button with loading state
- Real-time error clearing on input change
- Form validation before submission
- Calls new `emailPasswordLoginMutation`
- Stores JWT in `useAdminAuthStore` on success
- User-friendly error messages

#### 10. **frontend/src/hooks/useAdmin.ts** (MODIFIED)
- Removed `googleAdminLoginMutation` (Google OAuth for admin)
- Added `emailPasswordLoginMutation` for email/password login
- Mutation calls `adminLogin(email, password)` from api/admin
- On success: stores token and admin in `useAdminAuthStore`
- On error: shows toast notification with error message
- Exports `emailPasswordLoginMutation` for use in AdminLoginPage

#### 11. **frontend/src/pages/AuthCallbackPage.tsx** (SIMPLIFIED)
**Before:** Complex logic attempting to detect admins through:
- Supabase session check
- `admin_users` table query
- `/admin/me` API call
- Fallback redirects to `/admin`
**After:** Customer OAuth only (streamlined flow)
- No admin detection logic
- No `/admin/me` calls
- Blocks `/admin` paths from OAuth callback
- Completes customer login only
- Redirects to customer checkout (not admin)
- Clean separation of concerns

#### 12. **frontend/src/store/auth.ts** (NO CHANGES NEEDED)
- Already has separate `useAdminAuthStore` for admin JWT
- Stores `token` (backend JWT) and `admin` (user payload) separately
- `setSession()` stores both values
- `clearSession()` clears both on logout
- Compatible with new backend JWT system

### Environment Variables

#### Production/Development Configuration

```env
# Required for admin JWT signing and verification
ADMIN_JWT_SECRET=<your-secret-key>
ADMIN_JWT_EXPIRES_IN=7d

# Comma-separated list of allowed admin emails
ADMIN_EMAIL=kidabixson@gmail.com,yusuphshitambala@gmail.com
```

## Setup Instructions

### 1. Database Migration
```sql
-- Apply the new migration to add password_hash column
-- This will be auto-applied by Supabase when migrations are deployed
```

### 2. Initialize Admin Password Hashes

```bash
cd backend
node scripts/generate-admin-password-hashes.mjs
```

This outputs SQL like:
```sql
UPDATE admin_users SET password_hash = '<hash>', auth_method = 'password' WHERE email = 'kidabixson@gmail.com';
UPDATE admin_users SET password_hash = '<hash>', auth_method = 'password' WHERE email = 'yusuphshitambala@gmail.com';
```

Run these SQL statements against your `admin_users` table.

### 3. Ensure Admin Records Exist

```sql
INSERT INTO admin_users (id, email, full_name, role, is_active, auth_method, password_hash)
VALUES
  (gen_random_uuid(), 'kidabixson@gmail.com', 'Admin User 1', 'owner', true, 'password', '<hash-from-step-2>'),
  (gen_random_uuid(), 'yusuphshitambala@gmail.com', 'Admin User 2', 'admin', true, 'password', '<hash-from-step-2>')
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash, auth_method = 'password';
```

### 4. Deploy Changes
- Commit and push code changes
- Migrations auto-apply on Supabase
- Env vars are set in deployment platform

## Authentication Flow

### Admin Login Flow (NEW)
1. User navigates to `/admin/login`
2. User enters email (kidabixson@gmail.com or yusuphshitambala@gmail.com) and password
3. Frontend calls `POST /api/admin/login` with email and password
4. Backend validates:
   - Email is in allowed list
   - Admin record exists and is active
   - Password matches stored hash
5. Backend signs and returns JWT token
6. Frontend stores JWT in `useAdminAuthStore`
7. Frontend redirects to `/admin`
8. Admin routes use JWT for all API requests
9. Backend middleware (`requireAdmin`) verifies JWT on each request

### Customer Login Flow (UNCHANGED)
1. User navigates to `/login`
2. User clicks "Continue with Google"
3. OAuth callback to `/auth/callback`
4. Supabase session established
5. Frontend stores customer auth in `useAuthStore`
6. Redirect to checkout or original location

### Protected Admin Routes
- `/admin` - requires admin JWT
- `/admin/products` - requires admin JWT
- `/admin/quotes` - requires admin JWT
- All protected by `RequireAdmin` wrapper
- JWT verified by `requireAdmin` middleware

## Testing Checklist

### ✅ Admin Login
- [ ] Admin login page accessible at `/admin/login`
- [ ] Email field validates required and format
- [ ] Password field validates required and length
- [ ] Submit button disabled during loading
- [ ] Invalid credentials show error message
- [ ] Valid admin email + correct password succeeds
- [ ] Token stored in browser localStorage (`ys-admin-auth`)
- [ ] Redirects to `/admin` after successful login

### ✅ Admin Dashboard Access
- [ ] `/admin` shows dashboard when authenticated
- [ ] `/admin/products` shows product list when authenticated
- [ ] `/admin/quotes` shows quote list when authenticated
- [ ] API calls include `Authorization: Bearer <token>` header
- [ ] All admin endpoints return 200 with correct data

### ✅ Authorization
- [ ] Only allowed emails can login
- [ ] Invalid email gives 401 error
- [ ] Wrong password gives 401 error
- [ ] Inactive admin account gives 403 error
- [ ] Insufficient role gives 403 error

### ✅ JWT Verification
- [ ] Backend decodes JWT correctly
- [ ] Expired tokens give 401 error
- [ ] Tampered tokens give 401 error
- [ ] Missing token gives 401 error

### ✅ Admin Routes Protection
- [ ] Visiting `/admin` without token shows login page
- [ ] Visiting `/admin/products` without token redirects to login
- [ ] After logout, `/admin` shows login page
- [ ] No hanging spinners or timeouts

### ✅ Customer Auth Unchanged
- [ ] `/login` still shows customer Google OAuth
- [ ] Customer auth still works through Supabase
- [ ] Customer auth doesn't affect admin auth
- [ ] `/auth/callback` only handles customer OAuth
- [ ] No admin detection in callback page

### ✅ No Regressions
- [ ] Products page loads for customers
- [ ] Quote creation still works
- [ ] File uploads still work
- [ ] Shopping cart still works
- [ ] Customer quotes and orders visible
- [ ] Admin quotes endpoint returns data

### ✅ Console Validation
- [ ] No "auth mismatch" errors
- [ ] No "Supabase getUser failed" errors
- [ ] No timeout errors on `/admin/me`
- [ ] No redirect loops
- [ ] Clean successful login logs

## Validation Tests

### Test 1: Valid Admin Login
```
Email: kidabixson@gmail.com
Password: testing123 (or whatever was set)
Expected: Redirects to /admin, dashboard loads, no errors
```

### Test 2: Valid Second Admin
```
Email: yusuphshitambala@gmail.com
Password: testing123
Expected: Same as Test 1
```

### Test 3: Invalid Email
```
Email: unknown@example.com
Password: testing123
Expected: Shows "Invalid admin credentials" error
```

### Test 4: Wrong Password
```
Email: kidabixson@gmail.com
Password: wrongpassword
Expected: Shows "Invalid admin credentials" error
```

### Test 5: Missing Token
```
Clear browser storage, try to visit /admin
Expected: Redirects to /admin/login
```

### Test 6: Customer Auth Unaffected
```
Login through /login (Google)
Expected: Customer auth works, admin pages still require admin login
```

## Key Architectural Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Admin Auth Method** | Google OAuth | Email + Password |
| **Token Type** | Supabase JWT | Backend JWT (signed with `ADMIN_JWT_SECRET`) |
| **Token Verification** | `supabase.auth.getUser(token)` | `jwt.verify(token, ADMIN_JWT_SECRET)` |
| **Password Storage** | None (OAuth only) | PBKDF2 hashed in `admin_users.password_hash` |
| **Login Endpoint** | Supabase OAuth flow | `POST /api/admin/login` |
| **Frontend Login Page** | Google button | Email/Password form |
| **AuthCallbackPage** | Complex admin detection | Customer OAuth only |
| **AdminLoginPage** | Google OAuth button | Email/Password form |
| **Allowed Admins** | Any Google OAuth user | Only specified emails in config |
| **Session Storage** | Supabase session | Backend JWT in localStorage |

## Security Notes

1. ✅ **Password Hashing**: Uses PBKDF2 with 100,000 iterations and random salt
2. ✅ **Timing-Safe Comparison**: Prevents timing attacks
3. ✅ **JWT Signature**: Verified with secret key before use
4. ✅ **Email Whitelist**: Only allowed emails can login
5. ✅ **Database Verification**: Admin record checked on each request
6. ✅ **Separation of Concerns**: Admin auth completely separate from customer auth
7. ✅ **No OAuth Reliance**: Admin doesn't depend on Google OAuth
8. ⚠️ **HTTPS Only**: In production, ensure HTTPS for all API calls
9. ⚠️ **Secure Secrets**: Keep `ADMIN_JWT_SECRET` safe, never commit to git
10. ⚠️ **Strong Passwords**: Use 20+ character passwords in production (not "testing123")

## Troubleshooting

### Issue: "/admin/me timeout" or "auth mismatch"
**Solution**: This was the original bug. Now fixed by using JWT verification instead of Supabase OAuth.

### Issue: "Admin credentials invalid" on correct password
**Solution**: Password hash might not be set. Run the hash generation script and update database.

### Issue: Admin can't reach protected routes
**Solution**: Ensure JWT token is in `useAdminAuthStore`. Check browser devtools localStorage for `ys-admin-auth`.

### Issue: Customer login affected
**Solution**: Customer auth should be completely unaffected. If broken, check `/login` page and `AuthCallbackPage`.

---

**Implementation Date**: April 2026  
**Status**: Complete - Ready for testing and deployment
