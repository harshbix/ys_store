# Runtime Smoke Blockers

Date: 2026-04-05

## OTP request limit

A browser-based smoke run against the live backend hit the real auth rate limit on `POST https://ys-store-h1ec.onrender.com/api/auth/request-otp`.

Evidence from the latest smoke run `frontend/test-results/runtime-smoke-1775410873322.json`:
- HTTP status: `429`
- Error code: `otp_request_failed`
- Message: `Too many OTP requests. Please try again later.`
- Request id: `e010aa3d-b3fc-458a-b99a-60f6df023949`

Classification:
- Environment/testing constraint, not a frontend bug.

## Admin posting

Browser smoke confirmed the admin path is functionally working on the stable direct browser route:
- admin login succeeds
- product create succeeds
- uploaded image is rendered on product detail

The smoke suite should now treat admin post success as the real signal and avoid artificial retry-failure assertions.
