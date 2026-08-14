<!--
  StorefrontLayout — the public shell for one seller's shop.

  NOT to be confused with StoreLayout.vue in this same folder, which is the
  seller's private dashboard chrome (Orders / Finance / Analytics). This is what
  a *customer* sees after clicking a link the seller shared.

  The whole point is what it leaves out. No SideNav, no RightSideNav discovery
  rail, no Feed/Reels tabs, no "Start selling" pitch, no marketplace bottom nav
  — nothing that offers the visitor somewhere else to go. The seller brought
  this customer; the page's only jobs are to look like her business and let her
  customer buy.

  What stays: the cart (you cannot sell without it) and one honest line of
  MarketX attribution in the footer. That line is not a marketplace ad — the
  escrow and the verified badge are the reason a first-time buyer trusts an
  unfamiliar shop enough to pay, so it earns its place on the seller's side of
  the ledger.
-->
<template>
  <div
    class="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-neutral-950 dark:text-neutral-100"
  >
    <!-- ── Store header ─────────────────────────────────────────────────── -->
    <header
      class="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/95"
    >
      <div class="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <!-- Identity. Links to the shop root, never to the marketplace.
             Falls back to a <span> until a slug is known: `store` is fetched by
             the page, so during SSR and first paint it is null, and building
             /sellers/profile/ from an empty slug produced a link to a route
             that does not exist (Vue Router logged a no-match on every render). -->
        <component
          :is="shopHomeHref ? 'NuxtLink' : 'span'"
          :to="shopHomeHref"
          class="flex min-w-0 flex-1 items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <img
            v-if="store?.store_logo"
            :src="
              cloudinaryUrl(store.store_logo, {
                width: 80,
                height: 80,
                crop: 'fill',
              })
            "
            :alt="store.store_name ?? 'Store'"
            class="h-9 w-9 shrink-0 rounded-xl object-cover"
          />
          <div
            v-else
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10"
          >
            <Icon name="solar:shop-2-linear" size="18" class="text-brand" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="truncate text-[15px] font-bold leading-tight">
                {{ store?.store_name || 'Store' }}
              </span>
              <Icon
                v-if="store?.is_verified"
                name="solar:verified-check-bold"
                size="14"
                class="shrink-0 text-emerald-500"
                aria-label="Verified business"
              />
            </div>
            <span
              v-if="store?.is_verified"
              class="block text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
            >
              Verified business
            </span>
          </div>
        </component>

        <!-- Cart. The only action in this bar, because it is the only one the
             seller benefits from. -->
        <button
          type="button"
          class="relative shrink-0 rounded-xl p-2.5 text-gray-600 transition-colors hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
          aria-label="Open cart"
          @click="showCart = true"
        >
          <Icon name="solar:cart-large-2-linear" size="22" />
          <ClientOnly>
            <span
              v-if="cartCount > 0"
              class="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold text-white"
            >
              {{ cartCount > 99 ? '99+' : cartCount }}
            </span>
          </ClientOnly>
        </button>
      </div>
    </header>

    <!-- ── Page content ─────────────────────────────────────────────────── -->
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-4 sm:px-6">
      <slot />
    </main>

    <!-- ── Trust footer ─────────────────────────────────────────────────── -->
    <footer
      class="border-t border-gray-200 bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900/50"
    >
      <div
        class="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6"
      >
        <div class="flex items-center gap-2.5">
          <Icon
            name="solar:shield-check-bold"
            size="20"
            class="shrink-0 text-emerald-500"
          />
          <div>
            <p class="text-[13px] font-semibold">Protected by MarketX escrow</p>
            <p class="text-[11px] text-gray-500 dark:text-neutral-400">
              Your payment is held until you confirm delivery.
            </p>
          </div>
        </div>
        <div
          class="flex flex-wrap items-center gap-4 text-[11px] text-gray-500 dark:text-neutral-400"
        >
          <!-- One way out, in the footer rather than the header. A visitor who
               came for this shop should never be trapped in it, but the exit
               does not need to compete with the seller's own products. -->
          <NuxtLink to="/discover" class="font-semibold hover:text-brand">
            Explore MarketX →
          </NuxtLink>
          <NuxtLink to="/trust/how-it-works" class="hover:text-brand">
            How it works
          </NuxtLink>
          <NuxtLink to="/terms" class="hover:text-brand">Terms</NuxtLink>
          <NuxtLink to="/privacy" class="hover:text-brand">Privacy</NuxtLink>
        </div>
      </div>
    </footer>

    <CartSidebar :is-open="showCart" @close="showCart = false" />
    <!-- HomeLayout renders these too. Anything inside the page that calls
         useShareModal() sets shared state but needs a modal mounted somewhere
         to show it — without this, Share is a no-op in storefront chrome. -->
    <ShareModal
      :is-open="shareState.isOpen"
      :url="shareState.url"
      :title="shareState.title"
      @close="closeShare"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useCart } from '~~/layers/commerce/app/composables/useCart'
import { useCartDrawer } from '~~/layers/commerce/app/composables/useCartDrawer'
import { useStorefront } from '~~/layers/seller/app/composables/useStorefront'
import { useShareModal } from '~~/layers/social/app/composables/useShareModal'
import { cloudinaryUrl } from '~~/layers/core/app/utils/cloudinary'

const CartSidebar = defineAsyncComponent(
  () => import('~~/layers/commerce/app/components/CartSidebar.vue'),
)
const ShareModal = defineAsyncComponent(
  () => import('~~/layers/social/app/components/modals/ShareModal.vue'),
)

/**
 * Passed down by the page rather than fetched here — the store page and the
 * product page both already hold this data, and a layout-level fetch would be
 * a second round trip for something already on screen.
 */
const props = defineProps<{
  store?: {
    store_slug?: string | null
    store_name?: string | null
    store_logo?: string | null
    is_verified?: boolean | null
  } | null
}>()

const { cartCount } = useCart()
const { isOpen: showCart } = useCartDrawer()
const { storefrontSlug } = useStorefront()
const { shareState, closeShare } = useShareModal()

/**
 * Home of THIS shop — the short /{slug} form, which is a storefront entrance in
 * its own right and needs no marker appended.
 *
 * Falls back to the slug the context already knows, so the header stays a real
 * link during the window before the page's store data arrives. Null only when
 * neither is known, and the template degrades to a plain <span> rather than
 * emitting a link to nowhere.
 */
const shopHomeHref = computed(() => {
  const slug = props.store?.store_slug || storefrontSlug.value
  return slug ? `/${slug}` : null
})
</script>
