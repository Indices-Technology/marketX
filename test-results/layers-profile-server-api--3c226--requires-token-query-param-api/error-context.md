# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\profile\server\api\notifications\__tests__\notifications.spec.ts >> notifications — SSE stream >> GET /api/notifications/stream requires token query param
- Location: layers\profile\server\api\notifications\__tests__\notifications.spec.ts:12:3

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED ::1:3000
Call log:
  - → GET http://localhost:3000/api/notifications/stream
    - user-agent: Playwright/1.59.1 (x64; windows 10.0) node/24.11
    - accept: application/json
    - accept-encoding: gzip,deflate,br

```