# Admin Authentication System - Deployment & Verification Guide

## 🎯 Implementation Summary

A clean admin email/password authentication system with backend JWT verification, completely separate from customer Google OAuth.

---

## 📦 Deliverable: Final Admin Auth Flow

### 8-Step Authentication Flow

1. **Admin navigates to `/admin/login`**
   - Frontend displays email + password form
   - No Google OAuth involved

2. **Admin enters email and password**
   - Frontend validates format (email valid, password ≥8 chars)
   - Form shows real-time error feedback

3. **Admin clicks "Sign In"**
   - Frontend makes `POST /api/admin/login` with email + password
   - Backend receives request at loginController

4. **Backend validates credentials**
   - Checks email is in allowed list (ADMIN_EMAIL env var)
   - Queries admin_users table
   - Verifies password against stored password_hash using PBKDF2
   - If all valid, returns ✅

5. **Backend signs and returns JWT**
   - Creates JWT payload: `{ sub: admin.id, email, role }`
   - Signs with ADMIN_JWT_SECRET
   - Returns: `{ token: "eyJ...", admin: { id, email, role, ... } }`

6. **Frontend stores auth and redirects**
   - Saves JWT in `useAdminAuthStore` (`localStorage: ys-admin-auth`)
   - Redirects to `/admin` dashboard

7. **Admin requests protected resource**
   - Browser adds header: `Authorization: Bearer <jwt>`
   - Any request to `/api/admin/*` includes JWT

8. **Backend verifies JWT on every request**
   - `requireAdmin` middleware receives request
   - Decodes JWT with `jwt.verify(token, ADMIN_JWT_SECRET)`
   - Validates admin record exists and is active
   - Continues to requested endpoint (or returns 401/403)

---

## 🔐 Required Environment Variables

**Backend** (`backend/.env`):

```env
# ✅ Already configured in your repo
ADMIN_JWT_SECRET=local-dev-admin-secret
ADMIN_JWT_EXPIRES_IN=7d
ADMIN_EMAIL=kidabixson@gmail.com,yusuphshitambala@gmail.com

# These should also be set (check existing .env)
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_JWT_SECRET=your-secret
```

**Frontend** (no new env vars needed):
- Uses same backend API_URL as before
- No Supabase admin auth config needed

---

## 🗄️ Database Changes Required

### 1. Apply Migration
```sql
-- This will be auto-applied by Supabase during migration deployment
-- Or manually run in Supabase SQL editor:

ALTER TABLE admin_users ADD COLUMN password_hash TEXT;
ALTER TABLE admin_users ADD COLUMN auth_method TEXT NOT NULL DEFAULT 'password';

COMMENT ON COLUMN admin_users.password_hash IS 'Bcrypt hashed password for email/password authentication';
COMMENT ON COLUMN admin_users.auth_method IS 'Authentication method: password or oauth';
```

### 2. Generate Password Hashes

```bash
cd backend
node scripts/generate-admin-password-hashes.mjs
```

**Output** (example):
```sql
UPDATE admin_users SET password_hash = 'Gw4eR9h...base64encoded...', auth_method = 'password' WHERE email = 'kidabixson@gmail.com';
UPDATE admin_users SET password_hash = 'Jx2kL0m...base64encoded...', auth_method = 'password' WHERE email = 'yusuphshitambala@gmail.com';
```

### 3. Execute Password Updates

Run the generated SQL in your Supabase SQL editor:

```sql
UPDATE admin_users SET password_hash = '<PASTE_HASH_FROM_STEP_2>', auth_method = 'password' WHERE email = 'kidabixson@gmail.com';
UPDATE admin_users SET password_hash = '<PASTE_HASH_FROM_STEP_2>', auth_method = 'password' WHERE email = 'yusuphshitambala@gmail.com';
```

### 4. Verify Admin Records Exist

```sql
SELECT id, email, full_name, role, is_active, auth_method, password_hash 
FROM admin_users 
WHERE email IN ('kidabixson@gmail.com', 'yusuphshitambala@gmail.com');
```

Should show 2 rows with populated `password_hash` and `auth_method = 'password'`.

---

## 📋 Pre-Deployment Checklist

- [ ] Backend code deployed (all 7 files)
- [ ] Frontend code deployed (all 5 files)
- [ ] Database migration applied
- [ ] Password hashes generated and stored in database
- [ ] ADMIN_EMAIL env var set to both emails
- [ ] ADMIN_JWT_SECRET set to secure random string
- [ ] Backend env vars copied to deployment platform
- [ ] Supabase admin_users table has password_hash for both emails

---

## 🧪 Test Cases & Expected Results

### Test 1: Valid Admin Login - First Email
```
URL: http://localhost:5173/admin/login
Email: kidabixson@gmail.com
Password: testing123 (or whatever was used in step 2)
Expected: Redirect to /admin, dashboard loads, no errors
```

### Test 2: Valid Admin Login - Second Email
```
Email: yusuphshitambala@gmail.com
Password: testing123
Expected: Same as Test 1
```

### Test 3: Invalid Email
```
Email: unknown@gmail.com
Password: testing123
Expected: Error message: "Invalid admin credentials"
Status: Button remains clickable, can retry
```

### Test 4: Wrong Password
```
Email: kidabixson@gmail.com
Password: wrongpassword
Expected: Error message: "Invalid admin credentials"
```

### Test 5: Missing Credentials
```
Email: (empty)
Password: (empty)
Click Sign In
Expected: Inline errors: "Email is required", "Password is required"
Button disabled until filled
```

### Test 6: Session Verification
```
1. Login successfully (Test 1)
2. Open browser DevTools > Application > LocalStorage
3. Look for key "ys-admin-auth"
4. Value should contain: { "token": "eyJ...", "admin": {...} }
Expected: JWT token visible in storage
```

### Test 7: Protected Route Access
```
1. Login successfully
2. Visit /admin/products
3. Check Network tab for Authorization header
Expected: Header: "Authorization: Bearer eyJ..."
Response: Products list loads (200 OK)
```

### Test 8: Unprotected Route (Logout)
```
1. Login successfully
2. Open DevTools, manual delete "ys-admin-auth" key from LocalStorage
3. Refresh page (F5)
4. Watch redirect behavior
Expected: Redirects to /admin/login
No 401 errors, clean redirect
```

### Test 9: Customer Auth Unaffected
```
1. Visit /login (customer login)
2. Click "Continue with Google"
3. Complete OAuth flow
4. Verify customer auth works
Expected: Customer can login through Google
Admin auth completely separate
```

### Test 10: No Console Errors
```
1. Complete all Tests 1-9
2. Open DevTools > Console
Expected:
- ❌ No "Supabase getUser failed" messages
- ❌ No "auth mismatch" errors
- ❌ No timeout errors
- ❌ No redirect loops
- ✅ Clean login flow messages
```

---

## 🚀 Deployment Steps

### 1. Push Code
```bash
git add .
git commit -m "feat: implement email/password admin auth with backend JWT

- Replace Supabase OAuth admin auth with email/password
- Backend JWT verification instead of OAuth tokens
- New admin login page with form
- Separate admin auth store from customer auth
- Remove admin detection from OAuth callback
"
git push
```

### 2. Deploy Backend
```bash
# In your Vercel/Railway/Render deployment:
cd backend
npm install  # Installs no new packages (uses existing)
npm run build  # If applicable
# Deployment auto-runs from git push
```

### 3. Deploy Frontend
```bash
# Frontend automatically deploys from git push
# Vercel/Netlify will build and deploy frontend
```

### 4. Run Database Migration
```sql
-- In Supabase SQL Editor:
-- Paste and run the migration from backend/supabase/migrations/021_add_admin_password_hash.sql
```

### 5. Populate Password Hashes
```bash
# From your development machine:
cd backend
node scripts/generate-admin-password-hashes.mjs > admin_hashes.sql

# Copy the output SQL statements
# Run in Supabase SQL Editor
```

### 6. Verify Deployment
```bash
# Hit the health endpoint:
curl https://your-api.com/api/health

# Try admin login:
curl -X POST https://your-api.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "kidabixson@gmail.com",
    "password": "testing123"
  }'

# Expected response:
# { "success": true, "data": { "token": "eyJ...", "admin": {...} } }
```

---

## 📊 Files Changed (Complete List)

### Backend
1. ✅ `backend/supabase/migrations/021_add_admin_password_hash.sql` - NEW
2. ✅ `backend/src/utils/password.js` - NEW
3. ✅ `backend/src/middleware/adminAuth.js` - MODIFIED
4. ✅ `backend/src/modules/admin/service.js` - MODIFIED
5. ✅ `backend/src/config/env.js` - MODIFIED
6. ✅ `backend/scripts/generate-admin-password-hashes.mjs` - NEW
7. ✅ `backend/supabase/seed/admin_users_setup.sql` - NEW

### Frontend
8. ✅ `frontend/src/api/admin.ts` - MODIFIED
9. ✅ `frontend/src/pages/AdminLoginPage.tsx` - MODIFIED
10. ✅ `frontend/src/hooks/useAdmin.ts` - MODIFIED
11. ✅ `frontend/src/pages/AuthCallbackPage.tsx` - MODIFIED
12. ✅ `frontend/src/store/auth.ts` - NO CHANGES (already correct)

### Documentation
13. 📝 `ADMIN_AUTH_IMPLEMENTATION.md` - NEW (detailed guide)
14. 📝 `ADMIN_AUTH_CHANGES_SUMMARY.md` - NEW (quick reference)
15. 📝 `ADMIN_AUTH_DEPLOYMENT.md` - NEW (this file)

---

## 🔍 Quick Verification Steps

### Step 1: Code Review
```bash
# Check all modified files are correct:
git diff backend/src/middleware/adminAuth.js
git diff backend/src/modules/admin/service.js
git diff frontend/src/pages/AdminLoginPage.tsx
# Should show JWT verification and email/password form
```

### Step 2: Syntax Check
```bash
# Backend
cd backend && npm run lint

# Frontend
cd frontend && npm run lint
```

### Step 3: Local Test
```bash
# Terminal 1:
cd backend && npm run dev
# Should start without errors, port 4000

# Terminal 2:
cd frontend && npm run dev
# Should start without errors, port 5173

# Browser:
# http://localhost:5173/admin/login
# Enter: kidabixson@gmail.com / testing123
# Should redirect to /admin dashboard
```

---

## ⚠️ Important Notes

1. **Password Management**
   - Hashes are one-way (can't recover original password)
   - If password lost, re-run hash generation script with new password
   - Each run generates different hashes, so keep output safe

2. **Security**
   - Keep ADMIN_JWT_SECRET secret (never commit to git)
   - Use strong passwords in production (20+ characters)
   - HTTPS required for all production traffic

3. **Backward Compatibility**
   - Customer auth unchanged (Google OAuth still works)
   - No breaking changes to public APIs
   - Admin routes work exactly as before

4. **Troubleshooting**
   - If admin can't login: Check password_hash is populated
   - If /admin/me times out: Check JWT verification logic (should be instant now)
   - If customer affected: Check AuthCallbackPage (should be customer-only)

---

## 📞 Rollback Plan

If issues occur:

```bash
# Revert to previous branch
git revert <commit-hash>

# Or keep this branch but restore adminAuth.js to old version
git checkout HEAD~1 backend/src/middleware/adminAuth.js
git commit -m "revert: restore old admin auth"
```

---

## ✅ Success Criteria

Admin auth is **working correctly** when:

1. ✅ Admin can login with email + password
2. ✅ Returns JWT token (not Supabase token)
3. ✅ `/admin` dashboard loads
4. ✅ Admin products/quotes visible
5. ✅ No timeout or auth errors
6. ✅ Customer auth still works
7. ✅ No console errors
8. ✅ Only 2 allowed emails can login

---

**Ready for deployment!** 🚀

See `ADMIN_AUTH_IMPLEMENTATION.md` for deeper technical details.
