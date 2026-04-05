# App Capabilities and Limitations

Last updated: 2026-04-05

## What The App Can Do

### Storefront and Shopping
- Show live products from the backend catalog (no fixture source of truth in runtime flows).
- Render product details including uploaded media when storage bucket and URLs are correctly configured.
- Support product filtering, sorting, and browsing flows from live API data.
- Add products to cart and preserve guest cart session behavior.

### Auth and Sessions
- Sign in with email + password as the primary login flow.
- Register with full name, email, and password.
- Persist authenticated customer session across reloads after successful verification.
- Keep guest session continuity for cart and browsing flows.

Current note:
- OTP endpoints remain in backend for compatibility, but login UX is now password-first.

### Admin Operations
- Admin login with protected admin routes.
- Create products from the admin dashboard.
- Upload product media through signed upload URL flow and finalize media records.
- Edit and archive (hide) products from admin flow.

### Builds, Quotes, and Messaging
- Create and validate custom builds.
- Convert cart/build data into quote requests.
- Track WhatsApp quote-click flow in backend analytics.

### Storage and Media
- Store media in Supabase Storage bucket.
- Normalize product media URL records through storage scripts when needed.
- Use public media URLs for storefront/admin card rendering when bucket visibility is public.

## What The App Cannot Do (Current Limits)

### OTP Rate Limits In Repeated Tests
- Repeated OTP-based tests can be blocked with HTTP 429 (`otp_request_failed`).
- Repeated password account creation attempts can also hit provider email rate limits (HTTP 429).

### Legacy-vs-New Performance Evidence Gap
- Side-by-side latency comparison against legacy runtime is not currently available when legacy endpoint is unavailable.
- Current backend latency can be measured, but direct old-vs-new comparison remains incomplete without legacy target.

### Media Rendering Dependency
- Product card images depend on valid media URLs and storage bucket accessibility.
- If bucket visibility is private while using public URLs, images fail to load.

## Operational Notes

### Required for reliable image rendering
- Keep storage bucket configured as public when app uses public object URLs.
- Ensure product list and admin detail responses provide media URL fields.

### Required for reliable cross-domain auth/session
- Set frontend API base URL explicitly.
- Keep backend CORS allowlist aligned with active frontend origin(s).
- Keep cookie settings compatible with cross-domain usage in production (`SameSite=None`, `Secure=true`).

## Scope Clarification

This status reflects the current implemented and validated runtime behavior in this repository as of the date above. New changes should update this document whenever behavior, constraints, or cutover readiness changes.
