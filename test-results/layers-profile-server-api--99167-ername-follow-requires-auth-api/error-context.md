# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layers\profile\server\api\profile\__tests__\profile.spec.ts >> profile — auth guards >> POST /api/profile/:username/follow requires auth
- Location: layers\profile\server\api\profile\__tests__\profile.spec.ts:57:3

# Error details

```
Error: apiRequestContext.post: connect ECONNREFUSED ::1:3000
Call log:
  - → POST http://localhost:3000/api/profile/balogun_fabrics/follow
    - user-agent: Playwright/1.59.1 (x64; windows 10.0) node/24.11
    - accept: application/json
    - accept-encoding: gzip,deflate,br

```