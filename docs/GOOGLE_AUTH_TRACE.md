# Google Auth Runtime Trace

## Scope
Customer authentication is Google-only in the frontend experience. Email/password customer forms are removed from the customer login/register pages.

## Click-to-Session Flow
1. User opens `/login` or `/register`.
2. User clicks **Continue with Google**.
3. Frontend calls `supabase.auth.signInWithOAuth({ provider: 'google', options.redirectTo })`.
4. Browser is redirected to Google OAuth.
5. After Google consent, Supabase redirects back to the app with session context.
6. `useAuthSessionSync` runs at app startup and on auth state changes.
7. Session is copied into Zustand store via `completeLogin(access_token, user.id, user.email)`.
8. Protected routes (`/cart`, `/wishlist`, `/checkout`) allow access once auth bootstrap is ready and customer session is present.

## Files Involved
- `frontend/src/App.tsx`: mounts `useAuthSessionSync()` globally.
- `frontend/src/hooks/useAuthSessionSync.ts`: bootstrap + auth-state listener sync from Supabase to store.
- `frontend/src/hooks/useAuth.ts`: exposes `googleLoginMutation` and Google OAuth trigger.
- `frontend/src/pages/LoginPage.tsx`: Google-first sign-in UX.
- `frontend/src/pages/RegisterPage.tsx`: Google-first sign-up UX.
- `frontend/src/router/index.tsx`: protected routes wait for auth bootstrap before redirecting.

## Runtime Expectations
- Logged-out user visiting `/cart`, `/wishlist`, or `/checkout` is redirected to `/login`.
- After Google sign-in, user returns authenticated and can access protected customer routes.
- Refresh should preserve session because Supabase session is re-hydrated and synced on bootstrap.
- Logout clears Supabase session and local customer auth store.

## Required Supabase Config
- Google provider enabled in Supabase Auth.
- Redirect URL(s) configured in Supabase Auth provider settings:
  - local example: `http://localhost:5173/shop`
  - production example: `https://<frontend-domain>/shop`
- Site URL configured to the frontend origin.

## Caveats
- Full OAuth redirect/consent cannot be fully completed in headless automation without interactive provider credentials/consent.
- If provider settings are incomplete, Google button will fail with `google_oauth_failed` mapped user-facing error.
