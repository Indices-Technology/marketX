/**
 * useSeo — centralised SEO for every page type.
 *
 * Rules:
 * - Every page calls one setter from this composable. No raw useSeoMeta in pages.
 * - Private/auth pages get robots: noindex automatically.
 * - Titles follow the pattern: "Page Title | MarketX"
 * - OG images fall back to /og-default.png when no specific image exists.
 * - Structured data is emitted by the setters too (see useJsonLd), so a page
 *   never has to know which schema.org type it is.
 *
 * Usage:
 *   const { setStorePage } = useSeo()
 *   setStorePage({ store_name: 'Kemi Fabrics', ... })
 */
import { BRAND } from '~~/layers/core/app/utils/brand'
import {
  storeCardImage,
  productCardImage,
} from '~~/layers/core/app/utils/cardImage'
import {
  breadcrumbSchema,
  organizationSchema,
  productSchema,
  storeSchema,
  useJsonLd,
  webSiteSchema,
} from '~~/layers/core/app/composables/useJsonLd'

/**
 * ISO 4217 code for schema.org offers and the OG product extensions. Prices are
 * stored and displayed in Naira; the exchange-rate endpoint converts for
 * display only, so the canonical offer currency is always NGN.
 */
const CURRENCY = 'NGN'

/**
 * Routes that render identical content under more than one URL. Each entry
 * rewrites the duplicate to the URL that should own the ranking.
 *
 * A seller's store is reachable at BOTH `/{slug}` (the vanity URL on the Trust
 * Card, QR codes and WhatsApp bios) and `/sellers/profile/{slug}` (what
 * internal links point at, to skip a redirect hop). Neither redirects — that is
 * deliberate, see layers/seller/app/pages/[store].vue — so without this the two
 * compete as duplicates and split their own link equity. The vanity URL wins,
 * because it is the one that collects external links.
 */
const CANONICAL_REWRITES: Array<[RegExp, string]> = [
  [/^\/sellers\/profile\/([^/]+)\/?$/, '/$1'],
  // `/@amara` and `/amara` resolve to the same storefront ([store].vue strips
  // the leading @), so fold the handle form into the plain one.
  [/^\/@([^/]+)\/?$/, '/$1'],
]

export const useSeo = () => {
  const config = useRuntimeConfig()
  const siteName = (config.public.siteName as string) || BRAND.name
  const baseURL = (config.public.baseURL as string) || `https://${BRAND.domain}`
  const defaultImage = `${baseURL}/og-default.png`

  // ── Shared head defaults (call once in app.vue or a layout) ──────────────
  const defaults = () => {
    const route = useRoute()

    /**
     * One canonical for the whole app, derived from the path.
     *
     * Deriving it beats setting it per-page: it cannot be forgotten, and it
     * drops the query string — which matters because so much traffic arrives
     * carrying one (`?source=pwa`, `?source=pwa-shortcut`, `?ref=` affiliate
     * codes, `?store=`, discover filters). Every one of those is a separate URL
     * to a crawler, all serving the same page.
     */
    const canonical = () => {
      let path = route.path.replace(/\/+$/, '') || '/'
      for (const [pattern, replacement] of CANONICAL_REWRITES) {
        if (pattern.test(path)) {
          path = path.replace(pattern, replacement)
          break
        }
      }
      return `${baseURL}${path === '/' ? '' : path}` || baseURL
    }

    useHead({
      titleTemplate: (t) => (t ? `${t} | ${siteName}` : siteName),
      htmlAttrs: { lang: 'en' },
      link: [{ key: 'canonical', rel: 'canonical', href: canonical }],
    })
    useSeoMeta({
      ogSiteName: siteName,
      ogType: 'website',
      ogLocale: 'en_US',
      twitterCard: 'summary_large_image',
      twitterSite: BRAND.twitterHandle,
    })

    // Site-wide identity. Emitted once, here, so every page inherits the
    // publisher graph that Product/Store schemas reference by @id.
    useJsonLd('organization', organizationSchema({ siteName, baseURL }))
    useJsonLd('website', webSiteSchema({ siteName, baseURL }))
  }

  // ── Public pages ─────────────────────────────────────────────────────────

  const setHomePage = () => {
    const desc = `Buy safely from trusted Nigerian businesses on ${siteName}. Verify any seller, pay protected with escrow, and release funds only when your order arrives.`
    const title = `${siteName} — Buy safely from trusted Nigerian businesses`
    useSeoMeta({
      // Not `siteName`: titleTemplate appends " | MarketX", so passing the brand
      // here rendered the home page — the most valuable title on the site — as
      // "MarketX | MarketX". The value proposition carries the keywords instead.
      title: 'Buy safely from trusted Nigerian businesses',
      description: desc,
      ogTitle: title,
      ogDescription: desc,
      ogImage: defaultImage,
      ogUrl: baseURL,
      twitterTitle: title,
      twitterDescription: desc,
      twitterImage: defaultImage,
    })
  }

  const setDiscoverPage = () => {
    const desc = `Discover businesses, products, and stores from sellers across Africa on ${siteName}. Browse fashion, food, beauty, electronics and more.`
    useSeoMeta({
      title: 'Discover',
      description: desc,
      ogTitle: `Discover | ${siteName}`,
      ogDescription: desc,
      ogImage: defaultImage,
      ogUrl: `${baseURL}/discover`,
    })
  }

  const setMapPage = () => {
    const desc = `Find stores and businesses near you on ${siteName}. Browse the map, see what's open, and shop without leaving your area.`
    useSeoMeta({
      title: 'Stores Near You',
      description: desc,
      ogTitle: `Stores Near You | ${siteName}`,
      ogDescription: desc,
      ogImage: defaultImage,
      ogUrl: `${baseURL}/map`,
    })
  }

  const setReelsPage = () => {
    const desc = `Watch product reels from sellers on ${siteName}. Discover and shop directly from short videos.`
    useSeoMeta({
      title: 'Reels',
      description: desc,
      ogTitle: `Reels | ${siteName}`,
      ogDescription: desc,
      ogImage: defaultImage,
      ogUrl: `${baseURL}/reels`,
    })
  }

  const setSellersPage = () => {
    const desc = `Browse all stores and businesses on ${siteName}. Follow your favourites and shop their latest products.`
    useSeoMeta({
      title: 'Discover Stores',
      description: desc,
      ogTitle: `Discover Stores | ${siteName}`,
      ogDescription: desc,
      ogImage: defaultImage,
      ogUrl: `${baseURL}/sellers`,
    })
  }

  const setThriftPage = () => {
    const desc = `Find pre-loved and thrift items at unbeatable prices on ${siteName}. Shop sustainably from sellers across Africa.`
    useSeoMeta({
      title: 'Thrift Market',
      description: desc,
      ogTitle: `Thrift Market | ${siteName}`,
      ogDescription: desc,
      ogImage: defaultImage,
      ogUrl: `${baseURL}/thrift`,
    })
  }

  /**
   * /verify — the guest-facing "is this seller safe to pay?" door.
   *
   * Worth its own setter: it is the one page that answers a query buyers
   * already type ("is <shop> legit"), it is reachable straight from a QR scan
   * with no session, and it shipped with no meta at all — so it had no title,
   * no description and no preview anywhere it was shared.
   */
  const setVerifyPage = () => {
    const desc = `Check any Nigerian seller before you pay. Look up a store on ${siteName} to see verification status, trust tier, and real order history — free, no account needed.`
    useSeoMeta({
      title: 'Verify a seller before you pay',
      description: desc,
      ogTitle: `Verify a seller before you pay | ${siteName}`,
      ogDescription: desc,
      ogImage: defaultImage,
      ogUrl: `${baseURL}/verify`,
      twitterImage: defaultImage,
    })
  }

  const setCategoryPage = (name: string, slug: string) => {
    const desc = `Browse ${name} products from verified sellers on ${siteName}. Compare prices, check seller trust scores, and pay protected with escrow.`
    useSeoMeta({
      title: name,
      description: desc,
      ogTitle: `${name} | ${siteName}`,
      ogDescription: desc,
      // This setter previously shipped no image at all, so category links
      // unfurled bare on WhatsApp and X — the two places they actually spread.
      ogImage: defaultImage,
      ogUrl: `${baseURL}/category/${slug}`,
      twitterImage: defaultImage,
    })

    useJsonLd(
      'breadcrumb',
      breadcrumbSchema([
        { name: 'Home', url: baseURL },
        { name: 'Discover', url: `${baseURL}/discover` },
        { name, url: `${baseURL}/category/${slug}` },
      ]),
    )
  }

  // ── Store / seller pages ─────────────────────────────────────────────────

  const setStorePage = (seller: {
    store_name?: string | null
    store_description?: string | null
    store_logo?: string | null
    store_banner?: string | null
    store_slug: string
    publicId?: string | null
    city?: string | null
    category?: string | null
    // Structured-data extras — all optional, all omitted from the schema when
    // absent rather than guessed at.
    state?: string | null
    latitude?: number | null
    longitude?: number | null
    store_phone?: string | null
    averageRating?: number | null
    totalReviews?: number | null
  }) => {
    const name = seller.store_name || seller.store_slug
    const location = seller.city ? ` · ${seller.city}` : ''
    const category = seller.category ? ` ${seller.category} ` : ' '
    const desc =
      seller.store_description ||
      `Shop${category}products from ${name}${location} on ${siteName}. Verified seller with fast delivery.`

    // Rich preview: a Cloudinary-composited card so every pasted link (WhatsApp,
    // Telegram, X, …) shows a branded image, not a bare logo.
    const brandDomain = (config.public.brandDomain as string) || BRAND.domain
    const ogImage =
      storeCardImage(
        {
          store_name: name,
          store_banner: seller.store_banner,
          publicId: seller.publicId,
        },
        {
          cloud: (config.public.cloudinaryCloud as string) || '',
          displayUrl: `${brandDomain}/${seller.store_slug}`,
          width: 1200,
          height: 630,
        },
      ) ||
      seller.store_logo ||
      defaultImage

    useSeoMeta({
      title: name,
      description: desc,
      ogTitle: `${name} | ${siteName}`,
      ogDescription: desc,
      ogImage,
      ogImageWidth: 1200,
      ogImageHeight: 630,
      ogImageAlt: `${name} on ${siteName}`,
      // The vanity URL, matching the canonical this page declares — og:url and
      // rel=canonical disagreeing is a classic way to split a page's signals
      // between two URLs.
      ogUrl: `${baseURL}/${seller.store_slug}`,
      ogType: 'profile',
      twitterCard: 'summary_large_image',
      twitterImage: ogImage,
    })

    useJsonLd(
      'store',
      storeSchema({
        name,
        description: desc,
        image: seller.store_logo || ogImage,
        url: `${baseURL}/${seller.store_slug}`,
        city: seller.city,
        state: seller.state,
        latitude: seller.latitude,
        longitude: seller.longitude,
        telephone: seller.store_phone,
        ratingValue: seller.averageRating,
        reviewCount: seller.totalReviews,
      }),
    )

    useJsonLd(
      'breadcrumb',
      breadcrumbSchema([
        { name: 'Home', url: baseURL },
        { name: 'Stores', url: `${baseURL}/sellers` },
        { name, url: `${baseURL}/${seller.store_slug}` },
      ]),
    )
  }

  // Keep old name for backwards compat
  const setSellerProfilePage = setStorePage

  // ── User profile ─────────────────────────────────────────────────────────

  const setProfilePage = (profile: {
    username?: string | null
    bio?: string | null
    avatar?: string | null
  }) => {
    const name = profile.username || 'Profile'
    const desc = profile.bio || `Follow @${name} on ${siteName}.`
    useSeoMeta({
      title: `@${name}`,
      description: desc,
      ogTitle: `@${name} | ${siteName}`,
      ogDescription: desc,
      ogImage: profile.avatar || defaultImage,
      ogUrl: `${baseURL}/profile/${profile.username}`,
      ogType: 'profile',
    })
  }

  // ── Product pages ────────────────────────────────────────────────────────

  // Accepts a getter so SEO stays reactive — call once in setup(); the meta
  // updates as the (lazily-fetched) product loads or changes. Registering
  // useSeoMeta inside a watcher (post-await) breaks lifecycle-hook injection.
  const setProductPage = (
    getProduct: () => {
      title?: string
      description?: string | null
      imageUrl?: string | null
      slug?: string
      price?: number
      sellerName?: string
      sellerPublicId?: string | null
      // Structured-data extras. `inStock` defaults to true only because a
      // product page that renders at all is a listed product; pass it
      // explicitly wherever variant stock is known.
      sku?: string | null
      inStock?: boolean
      averageRating?: number | null
      totalReviews?: number | null
      categoryName?: string | null
      categorySlug?: string | null
    },
  ) => {
    const buildDesc = () => {
      const p = getProduct()
      const title = p.title || 'Product'
      const seller = p.sellerName ? ` by ${p.sellerName}` : ''
      return (
        p.description ||
        `Buy ${title}${seller} on ${siteName}. Fast delivery across Nigeria and worldwide shipping available.`
      )
    }

    // Rich preview: a Cloudinary-composited product card (photo + price + title)
    // so pasted links unfurl as a branded image. Falls back to the raw product
    // photo, then the default OG. Getter keeps it reactive as the product loads.
    const brandDomain = (config.public.brandDomain as string) || BRAND.domain
    const cloud = (config.public.cloudinaryCloud as string) || ''
    const ogImage = () => {
      const p = getProduct()
      const priceText =
        p.price != null ? `₦${Number(p.price).toLocaleString('en-NG')}` : ''
      return (
        productCardImage(
          {
            title: p.title,
            imageUrl: p.imageUrl,
            priceText,
            sellerName: p.sellerName,
            sellerPublicId: p.sellerPublicId,
          },
          {
            cloud,
            displayUrl: p.slug
              ? `${brandDomain}/product/${p.slug}`
              : brandDomain,
            width: 1200,
            height: 630,
          },
        ) ||
        p.imageUrl ||
        defaultImage
      )
    }

    useSeoMeta({
      title: () => getProduct().title || 'Product',
      description: buildDesc,
      ogTitle: () => `${getProduct().title || 'Product'} | ${siteName}`,
      ogDescription: buildDesc,
      ogImage,
      ogImageWidth: 1200,
      ogImageHeight: 630,
      ogImageAlt: () => `${getProduct().title || 'Product'} on ${siteName}`,
      ogUrl: () => {
        const s = getProduct().slug
        return s ? `${baseURL}/product/${s}` : undefined
      },
      ogType: 'product',
      twitterCard: 'summary_large_image',
      twitterImage: ogImage,
    })

    // Open Graph product extensions — what makes a pasted link unfurl with a
    // price on Facebook/WhatsApp instead of just a photo and a title.
    useHead({
      meta: [
        {
          key: 'og:price:amount',
          property: 'product:price:amount',
          content: () => {
            const price = getProduct().price
            return price != null ? String(price) : ''
          },
        },
        {
          key: 'og:price:currency',
          property: 'product:price:currency',
          content: CURRENCY,
        },
        {
          key: 'og:availability',
          property: 'product:availability',
          content: () =>
            getProduct().inStock === false ? 'out of stock' : 'in stock',
        },
      ],
    })

    // Getters, for the same reason the meta above uses them: registered once
    // during setup, resolved again each time the product data changes.
    useJsonLd('product', () => {
      const p = getProduct()
      if (!p.title || !p.slug) return null
      return productSchema({
        name: p.title,
        description: p.description || buildDesc(),
        image: p.imageUrl,
        url: `${baseURL}/product/${p.slug}`,
        sku: p.sku,
        price: p.price,
        currency: CURRENCY,
        inStock: p.inStock !== false,
        sellerName: p.sellerName,
        ratingValue: p.averageRating,
        reviewCount: p.totalReviews,
      })
    })

    useJsonLd('breadcrumb', () => {
      const p = getProduct()
      if (!p.title || !p.slug) return null
      return breadcrumbSchema([
        { name: 'Home', url: baseURL },
        { name: 'Discover', url: `${baseURL}/discover` },
        ...(p.categoryName && p.categorySlug
          ? [
              {
                name: p.categoryName,
                url: `${baseURL}/category/${p.categorySlug}`,
              },
            ]
          : []),
        { name: p.title, url: `${baseURL}/product/${p.slug}` },
      ])
    })
  }

  // ── Auth pages (noindex) ─────────────────────────────────────────────────

  const setLoginPage = () => {
    useSeoMeta({
      title: 'Sign In',
      description: `Sign in to your ${siteName} account.`,
      robots: 'noindex',
    })
  }

  const setRegisterPage = () => {
    useSeoMeta({
      title: 'Create Account',
      description: `Join ${siteName} — create your free account and start buying or selling today.`,
      robots: 'noindex',
    })
  }

  // ── Private / dashboard pages (noindex) ──────────────────────────────────

  const setCheckoutPage = () => {
    useSeoMeta({
      title: 'Checkout',
      description: `Complete your order on ${siteName}.`,
      robots: 'noindex',
    })
  }

  const setOrdersPage = () => {
    useSeoMeta({
      title: 'My Orders',
      description: `View and track your orders on ${siteName}.`,
      robots: 'noindex',
    })
  }

  const setDashboardPage = (storeName?: string) => {
    useSeoMeta({
      title: storeName ? `${storeName} — Dashboard` : 'Seller Dashboard',
      description: `Manage your ${siteName} store.`,
      robots: 'noindex',
    })
  }

  const setInboxPage = () => {
    useSeoMeta({
      title: 'Business Inbox',
      description: `Your customer messages on ${siteName}.`,
      robots: 'noindex',
    })
  }

  const setSettingsPage = () => {
    useSeoMeta({
      title: 'Settings',
      description: `Manage your ${siteName} account settings.`,
      robots: 'noindex',
    })
  }

  // ── Static / legal pages ─────────────────────────────────────────────────

  const setLandingPage = () => {
    const desc = `${siteName} — The all-in-one platform for everyday business in Africa. Discover stores near you, buy local, and sell to the world.`
    useSeoMeta({
      // See setHomePage — `siteName` here renders as "MarketX | MarketX".
      title: 'The all-in-one platform for everyday business in Africa',
      description: desc,
      ogTitle: `${siteName} — Your Business, Fully Alive`,
      ogDescription: desc,
      ogImage: defaultImage,
      ogUrl: baseURL,
    })
  }

  const setPostPage = (post: {
    caption?: string | null
    mediaUrl?: string | null
    username?: string | null
  }) => {
    const author = post.username ? `@${post.username}` : 'a seller'
    const desc =
      post.caption?.slice(0, 160) || `Post by ${author} on ${siteName}.`
    useSeoMeta({
      title: post.caption?.slice(0, 60) || `Post by ${author}`,
      description: desc,
      ogTitle: `Post by ${author} | ${siteName}`,
      ogDescription: desc,
      ogImage: post.mediaUrl || defaultImage,
      ogType: 'article',
    })
  }

  const setPrivatePage = (title: string) => {
    useSeoMeta({
      title,
      robots: 'noindex',
    })
  }

  const setAboutPage = () => {
    const desc = `Learn about ${siteName} — the all-in-one platform for everyday business in Africa. Our story, our mission, our team.`
    useSeoMeta({
      title: 'About Us',
      description: desc,
      ogTitle: `About ${siteName}`,
      ogDescription: desc,
      ogUrl: `${baseURL}/about`,
    })
  }

  const setHelpPage = () => {
    useSeoMeta({
      title: 'Help Centre',
      description: `Get help with buying, selling, orders, and payments on ${siteName}.`,
      ogTitle: `Help Centre | ${siteName}`,
      ogUrl: `${baseURL}/help`,
    })
  }

  const setPrivacyPage = () => {
    useSeoMeta({
      title: 'Privacy Policy',
      description: `Learn how ${siteName} collects, uses, and protects your personal data.`,
      ogTitle: `Privacy Policy | ${siteName}`,
      ogUrl: `${baseURL}/privacy`,
    })
  }

  const setContactPage = () => {
    const desc = `Contact ${siteName} — support, partnerships, press, security and privacy. We reply within 24 hours on working days.`
    useSeoMeta({
      title: 'Contact Us',
      description: desc,
      ogTitle: `Contact ${siteName}`,
      ogDescription: desc,
      ogUrl: `${baseURL}/contact`,
    })
  }

  const setPartnersPage = () => {
    const desc = `Partner with ${siteName} — logistics, payments, trade associations and agencies. Join the API waitlist.`
    useSeoMeta({
      title: 'Partnerships & API',
      description: desc,
      ogTitle: `Partner with ${siteName}`,
      ogDescription: desc,
      ogUrl: `${baseURL}/partners`,
    })
  }

  const setCookiePolicyPage = () => {
    useSeoMeta({
      title: 'Cookie Policy',
      description: `How ${siteName} uses cookies and similar technologies, and how to control them.`,
      ogTitle: `Cookie Policy | ${siteName}`,
      ogUrl: `${baseURL}/policy/cookies`,
    })
  }

  /** Help centre article pages — one helper, the slug varies. */
  const setHelpArticlePage = (title: string, description: string, slug: string) => {
    useSeoMeta({
      title,
      description,
      ogTitle: `${title} | ${siteName}`,
      ogDescription: description,
      ogUrl: `${baseURL}/help/${slug}`,
    })
  }

  const setTermsPage = () => {
    useSeoMeta({
      title: 'Terms of Service',
      description: `Read the terms and conditions governing use of the ${siteName} platform.`,
      ogTitle: `Terms of Service | ${siteName}`,
      ogUrl: `${baseURL}/terms`,
    })
  }

  return {
    defaults,
    // Public
    setHomePage,
    setLandingPage,
    setDiscoverPage,
    setMapPage,
    setReelsPage,
    setSellersPage,
    setThriftPage,
    setVerifyPage,
    setCategoryPage,
    // Store / profile
    setStorePage,
    setSellerProfilePage,
    setProfilePage,
    // Product / post
    setProductPage,
    setPostPage,
    // Auth
    setLoginPage,
    setRegisterPage,
    // Dashboard / private
    setCheckoutPage,
    setOrdersPage,
    setDashboardPage,
    setInboxPage,
    setSettingsPage,
    setPrivatePage,
    // Static
    setAboutPage,
    setHelpPage,
    setHelpArticlePage,
    setContactPage,
    setPartnersPage,
    setPrivacyPage,
    setTermsPage,
    setCookiePolicyPage,
  }
}
