// TEMPORARY payment-flow observer. READ-ONLY. Delete after testing.
// Run once before the test, once after, and compare.
//
// Shows per-channel delivery: WHATSAPP / EMAIL / IN-APP, with recipients —
// plus the Notification rows that actually landed, so "job completed" and
// "user was really told" can be told apart.

import pg from 'pg'
import Redis from 'ioredis'

const MINS = Number(process.argv[2] || 60)
const since = Date.now() - MINS * 60_000

const c = new pg.Client({ connectionString: process.env.DATABASE_URL })
await c.connect()
const r = new Redis(process.env.QUEUE_REDIS_URL, { maxRetriesPerRequest: null, lazyConnect: true })
await r.connect()

const naira = (k) => '₦' + (Number(k || 0) / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })
const t = (d) => (d ? new Date(d).toISOString().slice(11, 19) : '—')
const cut = (s, n) => (s && s.length > n ? s.slice(0, n) + '…' : s || '')

console.log(`\n════ snapshot ${new Date().toISOString().slice(11, 19)} · last ${MINS} min ════`)

// ---- orders -------------------------------------------------------------
const orders = await c.query(
  `SELECT id, status, "paymentStatus", "totalAmount", "paymentRef", created_at
     FROM "Orders" WHERE created_at >= now() - ($1 || ' minutes')::interval
    ORDER BY id DESC LIMIT 10`, [MINS])
console.log(`\nORDERS (${orders.rowCount})`)
for (const o of orders.rows)
  console.log(`  #${o.id}  ${String(o.status).padEnd(16)} ${String(o.paymentStatus).padEnd(8)} ${naira(o.totalAmount).padStart(10)}  ${t(o.created_at)}  ref ${o.paymentRef ?? '—'}`)
if (!orders.rowCount) console.log('  (none)')

// ---- money --------------------------------------------------------------
const tx = await c.query(
  `SELECT "orderId", type, amount, created_at FROM "Transaction"
    WHERE created_at >= now() - ($1 || ' minutes')::interval
    ORDER BY created_at DESC LIMIT 15`, [MINS])
console.log(`\nWALLET TRANSACTIONS (${tx.rowCount})`)
for (const x of tx.rows)
  console.log(`  order #${x.orderId ?? '—'}  ${String(x.type).padEnd(16)} ${naira(x.amount).padStart(10)}  ${t(x.created_at)}`)
if (!tx.rowCount) console.log('  (none — no escrow credit)')

// ---- what was actually dispatched, per channel ---------------------------
const CHAN = {
  whatsapp: 'WHATSAPP',
  emails: 'EMAIL',
  notifications: 'IN-APP',
}
const sent = []

for (const [q, label] of Object.entries(CHAN)) {
  for (const state of ['completed', 'failed']) {
    const ids = await r.zrange(`bull:${q}:${state}`, -15, -1)
    if (!ids.length) continue
    // One pipeline instead of one round trip per job — the sequential version
    // took long enough to be killed by a 60s timeout.
    const pipe = r.pipeline()
    for (const id of ids) pipe.hgetall(`bull:${q}:${id}`)
    const res = await pipe.exec()
    for (const [err, job] of res) {
      if (err || !job?.timestamp || Number(job.timestamp) < since) continue
      let d = {}
      try { d = JSON.parse(job.data ?? '{}') } catch { /* ignore */ }
      sent.push({
        at: Number(job.finishedOn || job.timestamp),
        label,
        state,
        who: d.to ?? d.userId ?? '—',
        what: d.templateName ?? d.subject ?? d.message ?? d.type ?? '',
        why: job.failedReason,
      })
    }
  }
}
sent.sort((a, b) => a.at - b.at)

console.log(`\nMESSAGES DISPATCHED (${sent.length})`)
console.log('  time      channel   ok   recipient                     detail')
for (const s of sent) {
  console.log(
    `  ${t(s.at)}  ${s.label.padEnd(9)} ${(s.state === 'completed' ? '✓' : '✗').padEnd(4)} ` +
      `${cut(String(s.who), 28).padEnd(29)} ${cut(String(s.what), 46)}`,
  )
  if (s.why) console.log(`              └─ ${cut(s.why, 110)}`)
}
if (!sent.length) console.log('  (none)')

// ---- in-app rows that actually landed ------------------------------------
const notes = await c.query(
  `SELECT n.type, n.message, n.created_at, p.username, p.email
     FROM "Notification" n LEFT JOIN "Profile" p ON p.id = n."userId"
    WHERE n.created_at >= now() - ($1 || ' minutes')::interval
    ORDER BY n.created_at DESC LIMIT 15`, [MINS])
console.log(`\nIN-APP ROWS ACTUALLY CREATED (${notes.rowCount})`)
for (const n of notes.rows)
  console.log(`  ${t(n.created_at)}  ${String(n.type).padEnd(14)} → ${(n.username ?? n.email ?? '?').padEnd(18)} ${cut(n.message, 60)}`)
if (!notes.rowCount) console.log('  (none)')

// ---- totals --------------------------------------------------------------
console.log('\nQUEUE TOTALS   wait  active  completed  failed')
for (const q of ['notifications', 'emails', 'whatsapp', 'audit', 'reputation']) {
  const [w, a, cc, f] = await Promise.all([
    r.llen(`bull:${q}:wait`), r.llen(`bull:${q}:active`),
    r.zcard(`bull:${q}:completed`), r.zcard(`bull:${q}:failed`),
  ])
  console.log(`  ${q.padEnd(13)} ${String(w).padStart(4)}  ${String(a).padStart(6)}  ${String(cc).padStart(9)}  ${String(f).padStart(6)}`)
}

await c.end()
await r.quit()
