# YS STORE Build Spec v1.2 (Locked)

Status: Ready for implementation
Date: 2026-04-02

## 1) Locked Decisions

- Commerce model: Quote-first, WhatsApp handoff final conversion.
- No online payment.
- No installment workflow.
- No benchmark/FPS subsystem.
- Delivery details handled on WhatsApp (not pre-collected in web checkout).
- Quote must be persisted before WhatsApp redirect.
- Single admin (owner).
- Admin login by credentials.
- Customer OTP only for save features (wishlist, saved builds, persistent cart).
- Guest users can browse, use builder, cart, and send quote with no login.

## 2) Non-Negotiable Architecture Rules

1. product_specs keys must be controlled by spec_definitions (no free keys).
2. quote_items must snapshot title/specs/pricing at quote creation.
3. builder compatibility checks must run server-side before quote.
4. auto-replacement must be visible and explained to users.
5. quote creation must be idempotent.
6. WhatsApp click must be tracked before redirect.

## 3) Database Additions to v1.1

### 3.1 Required field additions

- quotes.idempotency_key text not null unique
- quotes.replacement_summary jsonb null
- analytics_events.event_name supports whatsapp_click_initiated

### 3.2 Strong constraints

- product_specs.spec_key references spec_definitions.spec_key (FK)
- unique(product_id, spec_key) for canonical spec storage
- cart_items: exactly one of product_id/custom_build_id
- quote_items: line_total_tzs = quantity * unit_estimated_price_tzs (enforced in service, checked in tests)

### 3.3 Helpful indexes

- quotes(idempotency_key) unique
- product_specs(spec_key, value_text)
- product_specs(spec_key, value_number)
- products(product_type, stock_status, is_visible)
- analytics_events(event_name, created_at desc)

## 4) API Contract (Exact Route List)

Base URL: /api

### 4.1 Public catalog

- GET /products
- GET /products/:slug
- GET /products/filters/options
- POST /compare

### 4.2 Cart

- GET /cart
- POST /cart/items
- PATCH /cart/items/:itemId
- DELETE /cart/items/:itemId

### 4.3 Builder

- POST /builds
- GET /builds/:buildId
- PATCH /builds/:buildId/items
- DELETE /builds/:buildId/items/:itemId
- POST /builds/:buildId/validate
- POST /builds/:buildId/add-to-cart

### 4.4 Quote + WhatsApp

- POST /quotes
- GET /quotes/:quoteCode
- POST /quotes/:quoteCode/whatsapp-click
- GET /quotes/:quoteCode/whatsapp-url

### 4.5 Customer OTP-only features

- POST /auth/request-otp
- POST /auth/verify-otp
- GET /wishlist
- POST /wishlist/items
- DELETE /wishlist/items/:productId
- GET /customer/persistent-cart
- PUT /customer/persistent-cart/sync

### 4.6 Admin

- POST /admin/login
- POST /admin/logout
- GET /admin/me
- GET /admin/products
- POST /admin/products
- GET /admin/products/:id
- PATCH /admin/products/:id
- POST /admin/products/:id/duplicate
- PATCH /admin/products/:id/stock
- PATCH /admin/products/:id/visibility
- PATCH /admin/products/:id/quick-edit
- GET /admin/quotes
- GET /admin/quotes/:id
- PATCH /admin/quotes/:id/status
- POST /admin/media/upload
- GET /admin/shop-media
- POST /admin/shop-media
- PATCH /admin/shop-media/:id
- DELETE /admin/shop-media/:id

### 4.7 Analytics

- POST /analytics/events

Allowed events (MVP):
- product_view
- add_to_cart
- build_created
- quote_created
- whatsapp_click
- whatsapp_click_initiated

## 5) Request/Response Requirements (Critical Endpoints)

### 5.1 POST /quotes

Request body:
- customer_name: string (required)
- notes: string (optional)
- source_type: cart | build (required)
- source_id: uuid (required)
- quote_type: laptop | desktop | build | upgrade | warranty | general (optional)
- idempotency_key: string (required)

Response body:
- quote_id: uuid
- quote_code: string
- quote_type: string
- status: new
- estimated_total_tzs: number
- whatsapp_message: string
- whatsapp_url: string

Behavior:
1. validate payload
2. resolve source cart/build and recalc totals
3. create quote + quote_items in one transaction
4. if idempotency_key already exists, return existing quote payload
5. emit analytics event quote_created

### 5.2 POST /quotes/:quoteCode/whatsapp-click

Request body: empty

Response body:
- ok: true

Behavior:
1. create analytics event whatsapp_click_initiated
2. set quote status from new to whatsapp_sent if not already advanced
3. set whatsapp_clicked_at timestamp if null

### 5.3 POST /builds/:buildId/validate

Request body:
- auto_replace: boolean (default true)

Response body:
- compatibility_status: valid | warning | invalid
- errors: array
- warnings: array
- replacements: array of { from_product_id, to_product_id, reason }
- normalized_items: array
- total_estimated_tzs: number

Validation checks:
- cpu socket matches motherboard socket
- gpu length <= case max_gpu_length_mm
- psu wattage >= estimated_system_wattage * 1.2
- ram type supported by motherboard and capacity boundaries

## 6) Controller/Service Contracts

### 6.1 Products module

Controller methods:
- listProducts(req, res)
- getProductBySlug(req, res)
- getFilterOptions(req, res)

Service methods:
- searchProducts(filters, pagination, sort)
- fetchProductDetail(slug)
- fetchFilterOptions(productType)

### 6.2 Cart module

Controller methods:
- getCart(req, res)
- addCartItem(req, res)
- updateCartItem(req, res)
- removeCartItem(req, res)

Service methods:
- resolveCartIdentity(req)
- getOrCreateCart(identity)
- addItem(cartId, payload)
- updateItem(cartId, itemId, payload)
- removeItem(cartId, itemId)
- computeCartTotals(cartId)

### 6.3 Builds module

Controller methods:
- createBuild(req, res)
- getBuild(req, res)
- upsertBuildItem(req, res)
- deleteBuildItem(req, res)
- validateBuild(req, res)
- addBuildToCart(req, res)

Service methods:
- createDraftBuild(identity)
- setBuildComponent(buildId, componentType, productId)
- runCompatibility(buildId, autoReplace)
- calculateBuildTotal(buildId)
- convertBuildToCartItem(buildId, cartId)

### 6.4 Quotes module

Controller methods:
- createQuote(req, res)
- getQuoteByCode(req, res)
- markWhatsappClick(req, res)
- getWhatsappUrl(req, res)

Service methods:
- createQuoteFromSource(payload, identity)
- generateQuoteCode(quoteType)
- buildQuoteMessage(quote)
- buildWhatsappUrl(message)
- trackWhatsappClick(quoteCode)

### 6.5 Admin module

Controller methods:
- login(req, res)
- logout(req, res)
- me(req, res)
- listProducts(req, res)
- createProduct(req, res)
- updateProduct(req, res)
- duplicateProduct(req, res)
- quickEditProduct(req, res)
- updateStock(req, res)
- updateVisibility(req, res)
- listQuotes(req, res)
- updateQuoteStatus(req, res)

Service methods:
- authenticateAdmin(email, password)
- createProductWithSpecs(payload)
- updateProductWithSpecs(productId, payload)
- duplicateProduct(productId)
- quickEdit(productId, estimatedPrice, stockStatus)
- transitionQuoteStatus(quoteId, nextStatus)

## 7) Validation and Security Policy

- Input validation at route edge (schema-based, reject unknown fields).
- Admin routes require auth middleware and role check owner.
- Rate limit /auth/request-otp and /quotes.
- CORS allowlist for frontend domain(s) only.
- Helmet headers enabled.
- Uploads only via signed URL from backend endpoint.
- No service-role key in frontend.

## 8) Media Pipeline (MVP)

On upload:
1. accept image file
2. generate thumbnail variant (e.g., 480px wide)
3. generate optimized full variant (e.g., 1600px max)
4. store both URLs in product_media variants metadata
5. return variant URLs to admin UI

Required metadata:
- original_url
- thumb_url
- full_url
- width
- height
- size_bytes

## 9) Frontend MVP Components to Build First

Catalog:
- ProductCard
- FilterPanel
- SortBar
- CompareTray (always visible once selection starts)

Product Detail:
- ProductGallery
- KeySpecsStrip
- PriceStockBlock

Builder:
- BuilderStepper
- ComponentSelector
- CompatibilityAlertList
- ReplacementNotice
- BuildSummary

Cart/Quote:
- CartItemRow
- CartSummary
- QuoteForm (name required, notes optional)
- WhatsAppActionCard

Admin:
- ProductTable with inline quick edit
- ProductForm (specs via spec_definitions only)
- QuoteStatusBoard

## 10) Implementation Order (Locked)

1. DB migrations and constraints
2. Admin auth + product/spec backend
3. Public products/filters/compare backend
4. Cart backend
5. Quote backend with idempotency
6. WhatsApp click tracking and URL endpoint
7. Builder backend validation + replacement logs
8. Frontend catalog + compare
9. Frontend cart + quote flow
10. Frontend builder
11. Admin UI
12. QA, analytics checks, deploy hardening

## 11) Test Priority Matrix

Critical tests:
- quote creation idempotency
- quote snapshot immutability
- builder compatibility validity
- auto-replacement logging visibility
- product_specs key integrity (spec_definitions FK)

High tests:
- cart guest session persistence
- compare filtering correctness
- admin quick edit race handling
- whatsapp click tracking and status transition

## 12) Remaining Unknowns

1. Final warranty text matrix by condition type.
2. Production backend host choice (Railway/Render/Fly/VPS).
3. Admin credential bootstrap method in production.
