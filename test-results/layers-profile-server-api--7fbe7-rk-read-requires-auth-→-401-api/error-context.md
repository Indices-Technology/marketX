# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\profile\server\api\notifications\__tests__\notifications.spec.ts >> notifications — CRUD auth guards >> PATCH mark-read requires auth → 401
- Location: layers\profile\server\api\notifications\__tests__\notifications.spec.ts:32:3

# Error details

```
Error: apiRequestContext.patch: connect ECONNREFUSED ::1:3000
Call log:
  - → PATCH http://localhost:3000/api/shared/notifications/1
    - user-agent: Playwright/1.59.1 (x64; windows 10.0) node/24.11
    - accept: application/json
    - accept-encoding: gzip,deflate,br

```