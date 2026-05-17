// GET /api/health — used by Railway/Render health probes and uptime monitors
export default defineEventHandler(() => ({
  ok: true,
  ts: Date.now(),
  env: process.env.NODE_ENV,
}))
