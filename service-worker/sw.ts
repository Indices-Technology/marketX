/**
 * MarketX service worker  (injectManifest strategy)
 * ─────────────────────────────────────────────────────────────────────────────
 * Why hand-written instead of Workbox's generateSW:
 *
 *   generateSW's only offline hook is `navigateFallback`, which registers a
 *   NavigationRoute that serves the fallback document for EVERY navigation —
 *   correct for a static SPA shell, fatal for an SSR app like this one (every
 *   page would render the offline screen). The previous config set
 *   `navigateFallback: '/offline'` against a URL that was never precached, so
 *   the route silently failed to register: the app was not broken, but offline
 *   support did not exist at all.
 *
 * The shape below is the SSR-safe equivalent:
 *   • navigations go to the network (never cached — SSR HTML is user-specific)
 *   • when the network fails, `setCatchHandler` serves the offline document
 *   • assets and public reads get explicit, expiring runtime caches
 *
 * Caching rules follow one hard privacy line: nothing that could be
 * account-scoped enters the cache. Shared phones are the norm in this market,
 * and a Cache Storage entry outlives a logout. Concretely — no SSR HTML, and
 * API responses only from a small public allowlist, only when the request
 * carries no `Authorization` header, and only when the server did not mark the
 * response `private` / `no-store`.
 */

/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { enable as enableNavigationPreload } from 'workbox-navigation-preload'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import {
  NavigationRoute,
  registerRoute,
  setCatchHandler,
} from 'workbox-routing'
import {
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope &
  typeof globalThis & {
    __WB_MANIFEST: Array<{ url: string; revision: string | null }>
  }

const DAY = 60 * 60 * 24

// ── Precache ─────────────────────────────────────────────────────────────────
// Deliberately tiny (icons only — see `injectManifest.globPatterns` in
// nuxt.config). The JS/CSS bundle is NOT precached: on a metered Nigerian
// mobile plan, pulling every route's chunk on first visit is real money spent
// on code most users never reach. `/_nuxt/**` is content-hashed and immutable,
// so the CacheFirst route below fills the cache lazily as pages are visited,
// which reaches the same offline outcome without the upfront download.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Starts the navigation request before this worker has finished booting —
// removes the SW startup latency that otherwise shows up as a slower first
// paint on low-end Android once a service worker is installed.
enableNavigationPreload()

// ── Update handshake ─────────────────────────────────────────────────────────
// `registerType: 'autoUpdate'` makes the client post SKIP_WAITING and reload
// once a new worker is waiting. generateSW injected this; injectManifest does
// not, so without it a new deploy would sit waiting until every tab closed.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
clientsClaim()

// ── Hashed build assets — immutable, so cache-first ───────────────────────────
registerRoute(
  ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/_nuxt/'),
  new CacheFirst({
    cacheName: 'mx-build-assets',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 250,
        maxAgeSeconds: 60 * DAY,
        purgeOnQuotaError: true,
      }),
    ],
  }),
)

// ── Google Fonts ─────────────────────────────────────────────────────────────
// Split in two on purpose: the stylesheet changes when Google rotates font
// files (revalidate it), the font binaries never change under a given URL
// (cache them hard). Without this, every cold start on a flaky connection
// blocks on fonts.googleapis.com before text renders.
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({ cacheName: 'mx-google-fonts-css' }),
)

registerRoute(
  ({ url }) => url.origin === 'https://fonts.gstatic.com',
  new CacheFirst({
    cacheName: 'mx-google-fonts',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * DAY }),
    ],
  }),
)

// ── Cloudinary images ────────────────────────────────────────────────────────
// Images only. Video is left to the network: it is served with Range requests,
// which a plain Cache strategy answers with a full 200 that Safari rejects,
// and a cached reel would blow the storage quota anyway.
registerRoute(
  ({ url }) =>
    url.origin === 'https://res.cloudinary.com' &&
    url.pathname.includes('/image/upload/'),
  new CacheFirst({
    cacheName: 'mx-cloudinary-images',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 30 * DAY,
        purgeOnQuotaError: true,
      }),
    ],
  }),
)

// ── Public API reads ─────────────────────────────────────────────────────────
// Allowlist, not denylist: a new account-scoped endpoint must be opted IN to
// caching rather than silently inheriting it.
const PUBLIC_API =
  /^\/api\/(products|tags|search|map|reputation|exchange-rates)(\/|$)/

/**
 * Drops anything the origin marked as non-shareable. Workbox strategies do not
 * read Cache-Control on their own, so without this a handler that later starts
 * returning `private` responses would quietly cache them.
 */
const respectCacheControl = {
  cacheWillUpdate: async ({ response }: { response: Response }) => {
    const cc = response.headers.get('cache-control') ?? ''
    if (cc.includes('private') || cc.includes('no-store')) return null
    return response.status === 200 ? response : null
  },
}

registerRoute(
  ({ url, request, sameOrigin }) =>
    sameOrigin &&
    request.method === 'GET' &&
    PUBLIC_API.test(url.pathname) &&
    // A Bearer token means the response is rendered for one account. The app
    // attaches one whenever a session exists (layers/core/app/services/base.api.ts),
    // so this also keeps signed-in traffic out of the shared cache entirely.
    !request.headers.get('authorization'),
  new NetworkFirst({
    cacheName: 'mx-api-public',
    networkTimeoutSeconds: 5,
    plugins: [
      respectCacheControl,
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 300 }),
    ],
  }),
)

// ── Navigations ──────────────────────────────────────────────────────────────
// NetworkOnly, registered explicitly so failures reach the catch handler below.
// SSR HTML is never cached: it can carry the signed-in user's name, cart and
// order state, and a Cache Storage entry survives logout and account switches.
registerRoute(new NavigationRoute(new NetworkOnly()))

// ── Offline fallbacks ────────────────────────────────────────────────────────
// Self-contained on purpose. The `/offline` route
// (layers/core/app/pages/offline.vue) is the online/SSR version of this screen;
// it cannot be the offline one, because rendering it needs its stylesheet and
// hydration bundle — the exact requests that are failing when it is needed.
// Keep the two in visual sync by hand; this copy must stay dependency-free.
const OFFLINE_DOCUMENT = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#F43F5E">
<title>You're offline · MarketX</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;
    padding:24px calc(24px + env(safe-area-inset-right)) 24px calc(24px + env(safe-area-inset-left));
    background:#0f172a;color:#fff;text-align:center;
    font-family:Manrope,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
  .wrap{max-width:340px;display:flex;flex-direction:column;align-items:center;gap:16px}
  .mark{width:72px;height:72px;border-radius:20px;background:#F43F5E;display:flex;
    align-items:center;justify-content:center;font-weight:900;font-size:26px;letter-spacing:-.5px;
    box-shadow:0 8px 32px rgba(244,63,94,.4)}
  h1{margin:0;font-size:22px;font-weight:800;letter-spacing:-.3px}
  p{margin:0;font-size:14px;line-height:1.6;color:rgba(255,255,255,.55)}
  button{margin-top:4px;padding:12px 28px;border:0;border-radius:9999px;background:#F43F5E;
    color:#fff;font:inherit;font-size:14px;font-weight:700;cursor:pointer}
  button:active{transform:scale(.97)}
</style></head>
<body><div class="wrap">
  <div class="mark">MX</div>
  <h1>You&rsquo;re offline</h1>
  <p>MarketX needs a connection to load this page. Check your network and try again &mdash; pages you already opened will still work.</p>
  <button onclick="location.reload()">Try again</button>
</div></body></html>`

// 1x1 transparent placeholder so a broken image slot keeps its layout box
// instead of collapsing the grid it sits in.
const OFFLINE_IMAGE =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'

setCatchHandler(async ({ request }) => {
  switch (request.destination) {
    case 'document':
      return new Response(OFFLINE_DOCUMENT, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    case 'image':
      return new Response(OFFLINE_IMAGE, {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml' },
      })
    default:
      return Response.error()
  }
})
