# YS Store Parity Verification
## Step 1 Endpoint Coverage Gap Report

Date: 2026-04-04
Status: Complete

Scope rules used:
- Frontend-used means endpoint is called from active hooks/pages/components in current app code.
- Has parity test = backend parity or regression tests include the endpoint path in assertions.
- Tested via frontend = executed through running frontend against target backend in this verification run.

## Active Frontend-Used Endpoints

| Method | Path | Used in frontend file(s) | Has parity test? | Tested via frontend? | Risk |
|---|---|---|---|---|---|
| GET | /api/products | src/api/products.ts, src/hooks/useProducts.ts, src/pages/ShopPage.tsx, src/components/ui/ProductRail.tsx | YES | NO | HIGH |
| GET | /api/products/:slug | src/api/products.ts, src/hooks/useProducts.ts, src/pages/ProductDetailPage.tsx, src/hooks/useWishlist.ts | YES | NO | HIGH |
| GET | /api/cart | src/api/cart.ts, src/hooks/useCart.ts, src/components/layout/Header.tsx, src/pages/CartPage.tsx, src/pages/CheckoutPage.tsx, src/hooks/useAuth.ts | YES | NO | CRITICAL |
| POST | /api/cart/items | src/api/cart.ts, src/hooks/useCart.ts, src/pages/ShopPage.tsx, src/pages/ProductDetailPage.tsx, src/components/ui/ProductRail.tsx | YES | NO | CRITICAL |
| PATCH | /api/cart/items/:itemId | src/api/cart.ts, src/hooks/useCart.ts, src/pages/CartPage.tsx, src/components/cart/CartDrawer.tsx | YES | NO | CRITICAL |
| DELETE | /api/cart/items/:itemId | src/api/cart.ts, src/hooks/useCart.ts, src/pages/CartPage.tsx, src/components/cart/CartDrawer.tsx | YES | NO | CRITICAL |
| POST | /api/builds | src/api/builds.ts, src/hooks/useBuilds.ts, src/pages/BuilderPage.tsx | YES | NO | CRITICAL |
| GET | /api/builds/:buildId | src/api/builds.ts, src/hooks/useBuilds.ts, src/pages/BuilderPage.tsx | YES | NO | CRITICAL |
| PATCH | /api/builds/:buildId/items | src/api/builds.ts, src/hooks/useBuilds.ts, src/pages/BuilderPage.tsx | YES | NO | CRITICAL |
| DELETE | /api/builds/:buildId/items/:itemId | src/api/builds.ts, src/hooks/useBuilds.ts, src/pages/BuilderPage.tsx | YES | NO | CRITICAL |
| POST | /api/builds/:buildId/validate | src/api/builds.ts, src/hooks/useBuilds.ts, src/pages/BuilderPage.tsx | YES | NO | CRITICAL |
| POST | /api/builds/:buildId/add-to-cart | src/api/builds.ts, src/hooks/useBuilds.ts, src/pages/BuilderPage.tsx | YES | NO | CRITICAL |
| POST | /api/quotes | src/api/quotes.ts, src/hooks/useQuote.ts, src/pages/CheckoutPage.tsx | YES | NO | CRITICAL |
| POST | /api/quotes/:quoteCode/whatsapp-click | src/api/quotes.ts, src/hooks/useQuote.ts, src/pages/CheckoutPage.tsx | YES | NO | CRITICAL |
| POST | /api/auth/request-otp | src/api/auth.ts, src/hooks/useAuth.ts, src/pages/LoginPage.tsx | NO | NO | HIGH |
| POST | /api/auth/verify-otp | src/api/auth.ts, src/hooks/useAuth.ts, src/pages/LoginPage.tsx | NO | NO | HIGH |
| GET | /api/auth/wishlist | src/api/auth.ts, src/hooks/useWishlist.ts, src/pages/WishlistPage.tsx | YES | NO | MEDIUM |
| POST | /api/auth/wishlist/items | src/api/auth.ts, src/hooks/useWishlist.ts, src/pages/WishlistPage.tsx | YES | NO | MEDIUM |
| DELETE | /api/auth/wishlist/items/:productId | src/api/auth.ts, src/hooks/useWishlist.ts, src/pages/WishlistPage.tsx | NO | NO | MEDIUM |
| PUT | /api/auth/customer/persistent-cart/sync | src/api/auth.ts, src/hooks/useAuth.ts | NO | NO | HIGH |
| POST | /api/admin/login | src/api/admin.ts, src/hooks/useAdmin.ts, src/pages/AdminLoginPage.tsx | YES | NO | HIGH |
| POST | /api/admin/logout | src/api/admin.ts, src/hooks/useAdmin.ts | NO | NO | MEDIUM |
| GET | /api/admin/me | src/api/admin.ts, src/hooks/useAdmin.ts | NO | NO | MEDIUM |
| GET | /api/admin/products | src/api/admin.ts, src/hooks/useAdmin.ts, src/pages/AdminDashboardPage.tsx | YES | NO | HIGH |
| GET | /api/admin/products/:id | src/api/admin.ts, src/pages/AdminDashboardPage.tsx | NO | NO | HIGH |
| POST | /api/admin/products | src/api/admin.ts, src/hooks/useAdmin.ts, src/pages/AdminDashboardPage.tsx | YES | NO | HIGH |
| PATCH | /api/admin/products/:id | src/api/admin.ts, src/hooks/useAdmin.ts, src/pages/AdminDashboardPage.tsx | YES | NO | HIGH |
| POST | /api/admin/products/:id/duplicate | src/api/admin.ts, src/hooks/useAdmin.ts, src/pages/AdminDashboardPage.tsx | NO | NO | MEDIUM |
| PATCH | /api/admin/products/:id/visibility | src/api/admin.ts, src/hooks/useAdmin.ts, src/pages/AdminDashboardPage.tsx | YES | NO | MEDIUM |
| GET | /api/admin/quotes | src/api/admin.ts, src/hooks/useAdmin.ts, src/pages/AdminDashboardPage.tsx | NO | NO | MEDIUM |
| POST | /api/media/admin/upload-url | src/api/admin.ts, src/hooks/useAdmin.ts, src/pages/AdminDashboardPage.tsx | YES | NO | HIGH |
| POST | /api/media/admin/upload/finalize | src/api/admin.ts, src/hooks/useAdmin.ts, src/pages/AdminDashboardPage.tsx | NO | NO | HIGH |

## Frontend API Helpers Present But Not Active In Current UI Flow

| Method | Path | API file | Active runtime usage |
|---|---|---|---|
| GET | /api/auth/customer/persistent-cart | src/api/auth.ts | NO |
| GET | /api/quotes/:quoteCode | src/api/quotes.ts | NO |
| GET | /api/quotes/:quoteCode/whatsapp-url | src/api/quotes.ts | NO |

## Gaps Identified

Endpoints currently used by frontend but with NO backend parity test coverage:
- /api/auth/request-otp
- /api/auth/verify-otp
- /api/auth/wishlist/items/:productId (DELETE)
- /api/auth/customer/persistent-cart/sync
- /api/admin/logout
- /api/admin/me
- /api/admin/products/:id (GET)
- /api/admin/products/:id/duplicate
- /api/admin/quotes
- /api/media/admin/upload/finalize

Endpoints currently only validated by backend-side tests and not yet verified through a running frontend in this parity run:
- All active frontend endpoints listed above (current Tested via frontend = NO)

Notes on partial confidence:
- /api/auth/wishlist and /api/auth/wishlist/items have backend tests focused on auth guard behavior (401 protection), not full success-path payload parity.
