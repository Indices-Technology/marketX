# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\seller\server\api\seller\__tests__\seller-extended.spec.ts >> seller — messages inbox >> GET /api/seller/:id/messages returns 4xx for unknown store
- Location: layers\seller\server\api\seller\__tests__\seller-extended.spec.ts:61:3

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED ::1:3000
Call log:
  - → POST http://localhost:3000/api/auth/login
    - user-agent: Playwright/1.59.1 (x64; windows 10.0) node/24.11
    - accept: application/json
    - accept-encoding: gzip,deflate,br
    - content-type: application/json
    - content-length: 52

```