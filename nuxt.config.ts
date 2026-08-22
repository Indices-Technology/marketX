// https://nuxt.com/docs/api/configuration/nuxt-config

// Canonical job schedule, shared with the internal task endpoints and docs.
// Imported by relative path: config evaluation runs before aliases exist.
import { toNitroScheduledTasks } from './server/utils/taskSchedule'

// Relaxed CSP for the OpenAPI doc routes only (/_scalar, /_swagger). These
// pages load their UI bundle from jsdelivr; the spec is fetched same-origin.
// Scoped via routeRules so the app-wide CSP stays strict.
const OPENAPI_DOC_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com",
  "font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com",
  "img-src 'self' data: https://cdn.jsdelivr.net",
  "connect-src 'self' https://cdn.jsdelivr.net",
  "worker-src 'self' blob:",
].join('; ')

// Embeddable product card (/embed/product/[slug]) — meant to be iframed on
// arbitrary third-party sites (seller blogs, marketplaces), so it needs its own
// CSP with an explicit `frame-ancestors *`. Modern browsers give CSP
// frame-ancestors precedence over X-Frame-Options when both are present (verified
// against this app's own dev server), so the app-wide `X-Frame-Options:
// SAMEORIGIN` from the `/**` rule below is harmlessly superseded here rather than
// needing its own override. Otherwise as close to the app-wide policy as this
// read-only surface allows — no script-src beyond 'self' since it renders no
// third-party embeds of its own.
const EMBED_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: https://res.cloudinary.com",
  "media-src 'self' https://res.cloudinary.com",
  "connect-src 'self'",
  'frame-ancestors *',
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      charset: 'utf-8',
      htmlAttrs: { lang: 'en' },
      meta: [
        { name: 'theme-color', content: '#F43F5E' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'MarketX' },
        { name: 'application-name', content: 'MarketX' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/icons/icon-180.png',
        },
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '192x192',
          href: '/icons/icon-192.png',
        },
        { rel: 'icon', type: 'image/svg+xml', href: '/icons/icon-512.svg' },
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        { rel: 'preconnect', href: 'https://res.cloudinary.com' },
        // Non-blocking font load — preload first, swap to stylesheet on load
        {
          rel: 'preload',
          as: 'style',
          href: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..900&family=Manrope:wght@500;600;700;800&display=swap',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..900&family=Manrope:wght@500;600;700;800&display=swap',
          media: 'print',
          onload: "this.media='all'",
        },
      ],
    },
  },

  extends: [
    './layers/ui',
    './layers/ai',
    './layers/core',
    './layers/feed',
    './layers/seller',
    './layers/profile',
    './layers/shipping',
    './layers/commerce',
    './layers/social',
    './layers/map',
    './layers/square',
    './layers/admin',
    './layers/support',
    './layers/reputation',
    './layers/growth',
  ],

  icon: {
    serverBundle: {
      // 'solar' — MarketX's base set (see AppIcon.vue). 'simple-icons' — brand
      // logos (facebook/google/x/whatsapp/…). 'mdi' — 5 rare icons with no Solar
      // equivalent still in use (shoe-sneaker, diamond-stone, cookie-outline,
      // format-quote-open, lifebuoy).
      collections: ['solar', 'simple-icons', 'mdi'],
    },
  },

  modules: [
    '@nuxt/icon',
    '@pinia/nuxt',
    'nuxt3-notifications',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    'pinia-plugin-persistedstate/nuxt',
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
  ],

  // ── PWA ─────────────────────────────────────────────────────────────────────
  pwa: {
    registerType: 'autoUpdate',
    // injectManifest, not generateSW: an SSR app cannot use Workbox's
    // `navigateFallback` (it hijacks every navigation, not just failed ones).
    // The routing/caching policy lives in service-worker/sw.ts — read the
    // header comment there before changing anything here.
    strategies: 'injectManifest',
    srcDir: '../service-worker', // resolved against Nuxt's srcDir (app/)
    filename: 'sw.ts',
    manifest: {
      name: 'MarketX',
      short_name: 'MarketX',
      description:
        'Your business, fully alive. Discover stores, buy local, sell globally.',
      theme_color: '#F43F5E',
      background_color: '#0f172a',
      display: 'standalone',
      // Fallbacks for browsers that reject `standalone` — a tabless
      // minimal-ui window still reads as an app, whereas dropping straight to
      // `browser` loses the install entirely.
      display_override: ['standalone', 'minimal-ui'],
      // Deliberately NOT locked to portrait. The install target is every
      // device: a locked orientation makes the tablet and desktop installs
      // letterbox, and blocks landscape video on phones. Reels lock their own
      // orientation at the component level where it actually applies.
      orientation: 'any',
      scope: '/',
      start_url: '/?source=pwa',
      id: '/',
      lang: 'en',
      dir: 'ltr',
      // Reuse the open app window instead of spawning a second one when a
      // shortcut, share target or deep link is activated.
      launch_handler: { client_mode: ['navigate-existing', 'auto'] },
      categories: ['shopping', 'business', 'social'],
      icons: [
        // PNG — required for iOS home screen (Safari ignores SVG icons)
        {
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any',
        },
        {
          src: '/icons/icon-maskable-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
        // SVG fallback for browsers that support it
        {
          src: '/icons/icon-192.svg',
          sizes: '192x192',
          type: 'image/svg+xml',
          purpose: 'any',
        },
        {
          src: '/icons/icon-512.svg',
          sizes: '512x512',
          type: 'image/svg+xml',
          purpose: 'any',
        },
      ],
      shortcuts: [
        {
          name: 'Discover',
          short_name: 'Discover',
          description: 'Browse trending products and stores',
          url: '/discover?source=pwa-shortcut',
          icons: [{ src: '/icons/shortcut-discover.svg', sizes: '96x96' }],
        },
        {
          name: 'Near Me',
          short_name: 'Near Me',
          description: 'Find stores around you',
          url: '/map?source=pwa-shortcut',
          icons: [{ src: '/icons/shortcut-map.svg', sizes: '96x96' }],
        },
        {
          name: 'My Store',
          short_name: 'Sell',
          description: 'Manage your store',
          url: '/seller/dashboard?source=pwa-shortcut',
          icons: [{ src: '/icons/shortcut-sell.svg', sizes: '96x96' }],
        },
      ],
    },
    injectManifest: {
      // Icons only. Everything else (build chunks, images, fonts, public API
      // reads) is cached lazily at runtime by sw.ts — precaching the whole
      // bundle would download every route's JS on first visit, which is a real
      // cost on a metered mobile plan and the majority of our traffic.
      globPatterns: ['icons/**/*.{png,svg}', 'favicon.ico'],
    },
    client: {
      // localStorage key holding the "user dismissed the install nudge" flag —
      // read by PwaInstallPrompt.vue via `$pwa.cancelInstall()`.
      installPrompt: 'marketx:hide-install',
      // Poll for a new worker hourly. Installed PWAs are opened for weeks
      // without a cold start, so without this a deploy can go unnoticed.
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: false, // disable in dev to avoid noise
      type: 'module',
    },
  },

  // ── i18n ─────────────────────────────────────────────────────────────────────
  i18n: {
    defaultLocale: 'en',
    langDir: 'locales/',
    lazy: true,
    strategy: 'no_prefix',
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'fr', name: 'Français', file: 'fr.json' },
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'de', name: 'Deutsch', file: 'de.json' },
      { code: 'pt', name: 'Português', file: 'pt.json' },
      { code: 'zh', name: '中文', file: 'zh.json' },
      { code: 'ar', name: 'العربية', file: 'ar.json', dir: 'rtl' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      fallbackLocale: 'en',
    },
  },

  // ── Image ────────────────────────────────────────────────────────────────────
  image: {
    provider: 'cloudinary',
    cloudinary: {
      baseURL: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}`,
    },
  },

  // ── Nitro ────────────────────────────────────────────────────────────────────
  nitro: {
    plugins: ['plugins/monitoring', 'plugins/workers', 'plugins/dbMetrics'],
    compressPublicAssets: true,
    // Minification collapses the whole server bundle onto ONE line, so any
    // uncaught exception at boot makes Node print the entire program as the
    // "source context" — megabytes of minified code with the actual message
    // buried past whatever the log viewer will render. Undebuggable in practice.
    //
    // Set NITRO_MINIFY=false on a deployment to get a readable stack trace.
    // Server code is never downloaded by a browser, so this costs bundle size
    // and a little cold-start, nothing user-facing.
    minify: process.env.NITRO_MINIFY !== 'false',
    experimental: {
      websocket: true,
      tasks: true,
      openAPI: true,
      asyncContext: true, // lets server utils resolve the current event (useEvent) — used by db query metrics
    },
    // OpenAPI contract for API consumers (e.g. the native/mobile client).
    // Spec:  /api/openapi.json   ·   Docs:  /api/scalar  &  /api/swagger
    // `production: true` is REQUIRED for these to exist in a production build
    // (staging runs env=production); without it Nitro registers them in dev only.
    // Route detail comes from `defineRouteMeta({ openAPI: {...} })` in handlers.
    // All three are gated by OPENAPI_DOCS_SECRET (server/middleware/01.docs-auth.ts).
    openAPI: {
      production: true,
      route: '/api/openapi.json',
      ui: {
        scalar: { route: '/api/scalar' },
        swagger: { route: '/api/swagger' },
      },
      meta: {
        title: 'MarketX API',
        description:
          'Social commerce API. Auth via `Authorization: Bearer <accessToken>`; ' +
          'see docs/API_STRUCTURE.md for the route map and token lifecycle.',
        version: '1.0.0',
      },
    },
    // In-process cron is OPT-IN (NITRO_INPROCESS_CRON=true) and off by default.
    //
    // The schedule is owned by an EXTERNAL scheduler hitting
    // POST /api/internal/tasks/:name, so the jobs are not tied to any host's
    // capabilities — see docs/JOBS.md. Nitro's runner only fires on a long-lived
    // Node process (never on serverless), so leaving it on by default would mean
    // "works here, silently dead there", which is exactly what we're removing.
    //
    // Enable it only on an always-on single-instance host that is NOT also being
    // driven externally; running both just duplicates work (tasks are idempotent,
    // so it is safe, only wasteful).
    //
    // Task list + cron expressions: server/utils/taskSchedule.ts (single source
    // of truth, shared with GET /api/internal/tasks and the docs).
    scheduledTasks:
      process.env.NITRO_INPROCESS_CRON === 'true'
        ? toNitroScheduledTasks()
        : {},
    routeRules: {
      '/**': {
        headers: {
          'X-Frame-Options': 'SAMEORIGIN',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Strict-Transport-Security':
            'max-age=31536000; includeSubDomains; preload',
          'Permissions-Policy': 'geolocation=(self), camera=(), microphone=()',
          'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
          'Content-Security-Policy': [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://js.paystack.co",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://picsum.photos https://fastly.picsum.photos https://*.googleusercontent.com https://graph.facebook.com https://*.fbsbx.com https://platform-lookaside.fbsbx.com https://*.tiktokcdn.com https://*.tiktokcdn-us.com https://*.tiktokcdn-eu.com https://tiles.stadiamaps.com https://tiles.openfreemap.org https://api.maptiler.com https://*.cartocdn.com https://*.tile.openstreetmap.org",
            "media-src 'self' blob: https://res.cloudinary.com",
            // res.cloudinary.com + picsum: the MarketX Card download (html-to-image)
            // must fetch the store's images to inline them into the captured PNG.
            // fonts.googleapis/gstatic appear here as well as in style-src /
            // font-src: once the service worker caches fonts it re-issues those
            // requests itself, and a worker-initiated fetch is checked against
            // connect-src, not font-src. Without them, fonts fail CSP for every
            // SW-controlled page. See service-worker/sw.ts.
            "connect-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com https://api.paystack.co https://api.upstash.io https://api.iconify.design https://api.cloudinary.com https://res.cloudinary.com https://picsum.photos https://fastly.picsum.photos https://tiles.stadiamaps.com https://tiles.openfreemap.org https://api.maptiler.com https://*.cartocdn.com https://nominatim.openstreetmap.org https://*.tile.openstreetmap.org wss: ws:",
            'frame-src https://checkout.paystack.com',
            "worker-src 'self' blob:",
          ].join('; '),
        },
      },
      // Long-lived cache for hashed static assets
      '/_nuxt/**': {
        headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
      },
      // OpenAPI UI (Scalar / Swagger) loads its bundle from jsdelivr. The
      // app-wide CSP above blocks that, so relax it ONLY on these doc routes —
      // the rest of the app keeps the strict policy. The spec itself is fetched
      // same-origin (connect-src 'self').
      '/api/scalar': {
        headers: { 'Content-Security-Policy': OPENAPI_DOC_CSP },
      },
      '/api/swagger': {
        headers: { 'Content-Security-Policy': OPENAPI_DOC_CSP },
      },
      '/embed/**': {
        headers: {
          'Content-Security-Policy': EMBED_CSP,
          // Same product, second URL. Left indexable it would compete with
          // /product/[slug] for its own listing, so it is crawlable (robots.txt
          // allows it, so this header is actually read) but never indexed.
          'X-Robots-Tag': 'noindex, nofollow',
        },
      },
    },
  },

  // ── Vite ─────────────────────────────────────────────────────────────────────
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-vue': ['vue', 'vue-router', 'pinia'],
            'vendor-ui': ['@vueuse/core'],
          },
        },
      },
    },
  },

  // ── Tailwind ─────────────────────────────────────────────────────────────────
  // main.css is the Tailwind entry AND the typography system (ink-* / t-* roles).
  // Without this the module injects its own bare tailwind.css and every .t-*
  // class silently renders as unstyled text.
  tailwindcss: {
    cssPath: '~~/layers/core/app/assets/css/main.css',
  },

  // ── Color mode ───────────────────────────────────────────────────────────────
  colorMode: {
    preference: 'light',
    fallback: 'light',
    globalName: '__NUXT_COLOR_MODE__',
    componentName: 'ColorScheme',
    classPrefix: 'theme-',
    classSuffix: '-mode',
    storageKey: 'nuxt-color-mode',
  },

  // ── Runtime config ───────────────────────────────────────────────────────────
  runtimeConfig: {
    jamendoClientId: process.env.JAMENDO_CLIENT_ID || '',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    grokApiKey: process.env.GROK_API_KEY,
    googleApiKey: process.env.GOOGLE_API_KEY,
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY,
    upstashRedisUrl: process.env.UPSTASH_REDIS_REST_URL,
    upstashRedisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    resendApiKey: process.env.RESEND_API_KEY,
    shippoApiKey: process.env.SHIPPO_API_KEY,
    shippoWebhookSecret: process.env.SHIPPO_WEBHOOK_SECRET,
    sendboxAccessToken: process.env.SENDBOX_ACCESS_TOKEN,
    sendboxClientSecret: process.env.SENDBOX_CLIENT_SECRET,
    sendboxWebhookSecret: process.env.SENDBOX_WEBHOOK_SECRET,
    paypalClientId: process.env.PAYPAL_CLIENT_ID,
    paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
    soketiAppId: process.env.SOKETI_APP_ID || '1',
    soketiKey: process.env.SOKETI_KEY || 'app-key',
    soketiSecret: process.env.SOKETI_SECRET || 'app-secret',
    soketiHost: process.env.SOKETI_HOST || '127.0.0.1',
    soketiPort: process.env.SOKETI_PORT || '6001',
    soketiUseTLS: process.env.SOKETI_USE_TLS || 'false',
    public: {
      // Brand — all UI fallbacks read from here. Change .env, not component code.
      siteName: process.env.NUXT_PUBLIC_SITE_NAME || 'MarketX',
      brandDomain: process.env.NUXT_PUBLIC_BRAND_DOMAIN || 'marketx.africa',
      supportEmail:
        process.env.NUXT_PUBLIC_SUPPORT_EMAIL || 'support@marketx.africa',
      privacyEmail:
        process.env.NUXT_PUBLIC_PRIVACY_EMAIL || 'privacy@marketx.africa',
      legalEmail: process.env.NUXT_PUBLIC_LEGAL_EMAIL || 'legal@marketx.africa',
      baseURL: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      // Meta Pixel — unset by default (plugin no-ops without it) so ad
      // tracking never loads outside of an explicit campaign environment.
      metaPixelId: process.env.NUXT_PUBLIC_META_PIXEL_ID || '',
      // Cloudinary cloud name — exposed so the client (card downloads) and SSR
      // (OG images) can build composite card-image URLs from scratch.
      cloudinaryCloud: process.env.CLOUDINARY_CLOUD_NAME || '',
      dassaSocketUrl:
        process.env.NUXT_PUBLIC_DASSA_SOCKET_URL || 'http://localhost:4000',
      // Payments
      paystackPk: process.env.PAYSTACK_PUBLIC_KEY,
      // Pay on Delivery — off by default (paused); set NUXT_PUBLIC_POD_ENABLED=true to re-enable.
      podEnabled: process.env.NUXT_PUBLIC_POD_ENABLED === 'true',
      // GIG Logistics — off by default (paused): our carrier API access isn't
      // live yet, so GIG must not be quoted or booked. Sellers run their own
      // shipping (BYOS / pickup) meanwhile. Set NUXT_PUBLIC_GIG_ENABLED=true to
      // turn it back on platform-wide; per-seller `gigEnabled` preferences are
      // left untouched so they survive the pause.
      gigEnabled: process.env.NUXT_PUBLIC_GIG_ENABLED === 'true',
      // Trust homepage (hero Trust Card + spotlight rail). The reputation engine
      // is live and every figure is computed from real rows (orders / reviews /
      // dispute tickets — see server/utils/trustFacts.ts); nothing is seeded.
      // Sellers below MIN_EVIDENCE never appear, so an empty rail is a true
      // state. Still flag-gated so the surface is switched on deliberately:
      // on in dev automatically, in prod when NUXT_PUBLIC_TRUST_PREVIEW=true.
      trustPreview: process.env.NUXT_PUBLIC_TRUST_PREVIEW === 'true',
      // Cloudinary
      CloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      cloudinaryUploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET,
      // Email
      senderEmail: process.env.SENDER_EMAIL,
      // Soketi / Pusher (client-side only — no secret)
      soketiKey: process.env.SOKETI_KEY || 'app-key',
      soketiHost: process.env.SOKETI_HOST || '127.0.0.1',
      soketiPort: process.env.SOKETI_PORT || '6001',
      soketiUseTLS: process.env.SOKETI_USE_TLS || 'false',
    },
    private: {
      cloudinary: {
        apiSecret: process.env.CLOUDINARY_API_SECRET,
      },
    },
  },
})
