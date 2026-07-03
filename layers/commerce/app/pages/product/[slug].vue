<template>
  <HomeLayout :narrow-feed="false" :hide-right-sidebar="true">
    <!-- Loading skeleton -->
    <div
      v-if="pending || status === 'idle'"
      class="max-w-5xl animate-pulse px-3 py-4 sm:px-6 sm:py-6"
    >
      <!-- Mobile: stacked; Desktop: 2-col -->
      <div class="flex flex-col gap-8 lg:flex-row">
        <!-- Image gallery -->
        <div class="flex flex-col gap-2 lg:w-[480px] lg:shrink-0">
          <div
            class="aspect-square w-full rounded-2xl bg-gray-100 dark:bg-neutral-800"
          />
          <div class="flex gap-2">
            <div
              v-for="i in 4"
              :key="i"
              class="h-16 w-16 rounded-lg bg-gray-100 dark:bg-neutral-800"
            />
          </div>
        </div>
        <!-- Details -->
        <div class="flex-1 space-y-4">
          <div class="h-5 w-1/3 rounded bg-gray-100 dark:bg-neutral-800" />
          <div class="h-8 w-3/4 rounded-lg bg-gray-100 dark:bg-neutral-800" />
          <div class="h-7 w-1/4 rounded bg-gray-100 dark:bg-neutral-800" />
          <div class="space-y-2">
            <div class="h-4 rounded bg-gray-100 dark:bg-neutral-800" />
            <div class="h-4 w-5/6 rounded bg-gray-100 dark:bg-neutral-800" />
            <div class="h-4 w-4/6 rounded bg-gray-100 dark:bg-neutral-800" />
          </div>
          <div class="flex gap-3 pt-2">
            <div
              class="h-12 flex-1 rounded-xl bg-gray-100 dark:bg-neutral-800"
            />
            <div class="h-12 w-12 rounded-xl bg-gray-100 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    </div>

    <!-- Not found — only after fetch has actually completed -->
    <div
      v-else-if="status !== 'idle' && !pending && !product"
      class="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center"
    >
      <Icon
        name="mdi:shopping-outline"
        size="56"
        class="text-gray-300 dark:text-neutral-600"
      />
      <p class="text-lg font-semibold text-gray-700 dark:text-neutral-300">
        Product not found
      </p>
      <NuxtLink
        to="/discover"
        class="text-sm font-semibold text-brand hover:underline"
        >Browse products</NuxtLink
      >
    </div>

    <div v-else-if="product" class="mx-auto max-w-5xl px-4 py-6">
      <!-- Back -->
      <button
        class="mb-5 flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:hover:text-neutral-100"
        @click="$router.back()"
      >
        <Icon name="mdi:arrow-left" size="18" />
        Back
      </button>

      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- ── Image Gallery ── -->
        <div class="flex flex-col gap-3">
          <!-- Main image -->
          <div
            class="relative aspect-square overflow-hidden rounded-2xl bg-gray-50 bg-cover bg-center dark:bg-neutral-800"
            :style="
              mediaItems[currentIndex]
                ? {
                    backgroundImage: `url(${imgLqip(mediaItems[currentIndex].url)})`,
                  }
                : undefined
            "
          >
            <VideoPlayer
              v-if="mediaItems[currentIndex]?.type === 'VIDEO'"
              :src="mediaItems[currentIndex]!.url"
              :poster="videoThumb(mediaItems[currentIndex]!.url)"
              class="h-full w-full"
            />
            <img
              v-else
              :src="imgDetail(mediaItems[currentIndex]?.url)"
              :alt="product.title"
              class="h-full w-full object-contain"
              loading="eager"
              fetchpriority="high"
              decoding="async"
            />
            <!-- Nav arrows (multiple images) -->
            <template v-if="mediaItems.length > 1">
              <button
                aria-label="Previous image"
                class="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50"
                @click="
                  currentIndex =
                    (currentIndex - 1 + mediaItems.length) % mediaItems.length
                "
              >
                <Icon name="mdi:chevron-left" size="22" />
              </button>
              <button
                aria-label="Next image"
                class="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-md hover:bg-black/50"
                @click="currentIndex = (currentIndex + 1) % mediaItems.length"
              >
                <Icon name="mdi:chevron-right" size="22" />
              </button>
              <div
                class="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5"
              >
                <button
                  v-for="(_, i) in mediaItems"
                  :key="i"
                  :aria-label="`Go to image ${i + 1}`"
                  class="h-2 rounded-full transition-all"
                  :class="
                    i === currentIndex ? 'w-5 bg-brand' : 'w-2 bg-white/60'
                  "
                  @click="currentIndex = i"
                />
              </div>
            </template>
          </div>

          <!-- Thumbnail strip -->
          <div
            v-if="mediaItems.length > 1"
            class="flex gap-2 overflow-x-auto pb-1"
          >
            <button
              v-for="(item, i) in mediaItems"
              :key="i"
              class="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all"
              :class="
                i === currentIndex
                  ? 'border-brand'
                  : 'border-transparent opacity-60 hover:opacity-100'
              "
              @click="currentIndex = i"
            >
              <img
                :src="
                  item.type === 'VIDEO'
                    ? videoThumb(item.url)
                    : imgThumb(item.url)
                "
                :alt="`${product.title} ${i + 1}`"
                class="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <Icon
                v-if="item.type === 'VIDEO'"
                name="mdi:play-circle"
                size="14"
                class="pointer-events-none absolute inset-0 m-auto text-white drop-shadow"
              />
            </button>
          </div>

          <!-- Delivery & Deals card — fills empty left-column space on desktop -->
          <div
            class="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50"
          >
            <p
              class="mb-3 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500"
            >
              Delivery & Payment
            </p>

            <div class="space-y-3">
              <!-- POD -->
              <div
                v-if="product.seller?.pod_enabled"
                class="flex items-start gap-2.5"
              >
                <div
                  class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30"
                >
                  <Icon
                    name="mdi:truck-delivery-outline"
                    size="15"
                    class="text-emerald-600 dark:text-emerald-400"
                  />
                </div>
                <div>
                  <p
                    class="text-sm font-semibold text-gray-800 dark:text-neutral-200"
                  >
                    Pay on Delivery available
                  </p>
                  <p
                    v-if="podZones.length"
                    class="mt-0.5 text-[11px] text-gray-500 dark:text-neutral-400"
                  >
                    {{ podZones.slice(0, 4).join(', ')
                    }}{{
                      podZones.length > 4 ? ` +${podZones.length - 4} more` : ''
                    }}
                  </p>
                  <p
                    v-if="product.seller.pod_delivery_days"
                    class="text-[11px] text-gray-500 dark:text-neutral-400"
                  >
                    Delivered in {{ product.seller.pod_delivery_days }}–{{
                      product.seller.pod_delivery_days + 2
                    }}
                    days
                  </p>
                </div>
              </div>

              <!-- Bulk / volume offers -->
              <template v-if="product.offers?.length">
                <div
                  v-for="offer in product.offers"
                  :key="offer.id"
                  class="flex items-start gap-2.5"
                >
                  <div
                    class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand/10"
                  >
                    <Icon
                      name="mdi:tag-multiple-outline"
                      size="15"
                      class="text-brand"
                    />
                  </div>
                  <div>
                    <p
                      class="text-sm font-semibold text-gray-800 dark:text-neutral-200"
                    >
                      {{
                        offer.label ||
                        `Buy ${offer.minQuantity}+, save ${offer.discount}%`
                      }}
                    </p>
                    <p
                      v-if="offer.label"
                      class="mt-0.5 text-[11px] text-gray-500 dark:text-neutral-400"
                    >
                      Buy {{ offer.minQuantity }}+ units to qualify
                    </p>
                  </div>
                </div>
              </template>

              <!-- Shipping cost row -->
              <div class="flex items-center gap-2.5">
                <div
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-700"
                >
                  <Icon
                    name="mdi:package-variant-closed"
                    size="15"
                    class="text-gray-500 dark:text-neutral-400"
                  />
                </div>
                <div>
                  <p
                    class="text-sm font-semibold text-gray-800 dark:text-neutral-200"
                  >
                    Shipping calculated at checkout
                  </p>
                  <p class="text-[11px] text-gray-500 dark:text-neutral-400">
                    Based on your delivery address
                  </p>
                </div>
              </div>

              <!-- No POD note -->
              <div
                v-if="!product.seller?.pod_enabled"
                class="flex items-center gap-2.5"
              >
                <div
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-700"
                >
                  <Icon
                    name="mdi:truck-remove-outline"
                    size="15"
                    class="text-gray-400 dark:text-neutral-500"
                  />
                </div>
                <p class="text-sm text-gray-500 dark:text-neutral-400">
                  Pay on Delivery not available
                </p>
              </div>

              <div class="border-t border-gray-200 dark:border-neutral-700" />

              <!-- Trust lines -->
              <div class="space-y-2">
                <div
                  v-for="tip in trustTips"
                  :key="tip.text"
                  class="flex items-center gap-2 text-[12px] text-gray-500 dark:text-neutral-400"
                >
                  <Icon
                    :name="tip.icon"
                    size="13"
                    class="shrink-0 text-gray-400 dark:text-neutral-500"
                  />
                  {{ tip.text }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Product Info ── -->
        <div class="flex flex-col gap-5">
          <!-- Seller card -->
          <div
            v-if="product.seller"
            class="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-800/50"
          >
            <div class="flex items-start gap-3">
              <!-- Avatar -->
              <NuxtLink :to="`/sellers/profile/${product.seller.store_slug}`">
                <img
                  v-if="product.seller.store_logo"
                  :src="imgAvatar(product.seller.store_logo)"
                  class="h-12 w-12 rounded-xl object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div
                  v-else
                  class="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10"
                >
                  <Icon name="mdi:store-outline" size="22" class="text-brand" />
                </div>
              </NuxtLink>

              <!-- Info -->
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-1.5">
                  <NuxtLink
                    :to="`/sellers/profile/${product.seller.store_slug}`"
                    class="text-sm font-bold text-gray-900 hover:text-brand dark:text-neutral-100"
                  >
                    {{ product.seller.store_name || product.seller.store_slug }}
                  </NuxtLink>
                  <span
                    v-if="product.seller.is_verified"
                    class="flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  >
                    <Icon name="mdi:check-decagram" size="10" />
                    Verified
                  </span>
                  <span
                    v-if="product.seller.isPremium"
                    class="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  >
                    Premium
                  </span>
                </div>
                <div
                  class="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-gray-500 dark:text-neutral-400"
                >
                  <!-- Rating -->
                  <span
                    v-if="product.seller.averageRating"
                    class="flex items-center gap-0.5"
                  >
                    <Icon name="mdi:star" size="11" class="text-amber-400" />
                    {{ product.seller.averageRating.toFixed(1) }}
                    <span class="opacity-60"
                      >({{ product.seller.totalReviews }})</span
                    >
                  </span>
                  <!-- Location -->
                  <span
                    v-if="
                      product.seller.locationLabel ||
                      product.seller.store_location
                    "
                    class="flex items-center gap-0.5"
                  >
                    <Icon name="mdi:map-marker-outline" size="11" />
                    {{
                      product.seller.locationLabel ||
                      product.seller.store_location
                    }}
                  </span>
                  <!-- Member since -->
                  <span class="flex items-center gap-0.5">
                    <Icon name="mdi:calendar-outline" size="11" />
                    Since {{ sellerMemberSince }}
                  </span>
                  <!-- POD badge -->
                  <span
                    v-if="product.seller.pod_enabled"
                    class="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400"
                  >
                    <Icon name="mdi:truck-delivery-outline" size="11" />
                    Pay on delivery
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-3 flex gap-2">
              <NuxtLink
                :to="`/sellers/profile/${product.seller.store_slug}`"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-brand hover:text-brand dark:border-neutral-700 dark:text-neutral-300"
              >
                <Icon name="mdi:store-outline" size="14" />
                View Store
              </NuxtLink>
              <NuxtLink
                :to="`/messages?seller=${product.seller.store_slug}`"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d81b36]"
              >
                <Icon name="mdi:message-outline" size="14" />
                Chat with Seller
              </NuxtLink>
            </div>
          </div>

          <!-- Title & price -->
          <div>
            <!-- Market — the good lives inside a market square -->
            <NuxtLink
              v-if="product.square"
              :to="`/squares/${product.square.slug}`"
              class="mb-1.5 inline-flex items-center gap-1 rounded-full bg-brand/5 px-2.5 py-1 text-[12px] font-medium text-brand transition hover:bg-brand/10"
            >
              <Icon name="mdi:store-marker-outline" size="13" />
              {{ product.square.name }}
            </NuxtLink>
            <h1
              class="text-2xl font-bold leading-snug text-gray-900 dark:text-neutral-100"
            >
              {{ product.title }}
            </h1>
            <!-- Social proof: product rating + views -->
            <div
              class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 dark:text-neutral-400"
            >
              <a
                v-if="product.averageRating"
                href="#reviews"
                class="flex items-center gap-0.5 font-semibold text-amber-500"
              >
                <Icon name="mdi:star" size="12" />
                {{ product.averageRating.toFixed(1) }}
                <span class="font-normal text-gray-500 dark:text-neutral-400"
                  >({{ product.totalReviews ?? 0 }} reviews)</span
                >
              </a>
              <span
                v-if="product.viewCount > 0"
                class="flex items-center gap-1"
              >
                <Icon name="mdi:eye-outline" size="12" />
                {{ product.viewCount.toLocaleString() }}
                {{ product.viewCount === 1 ? 'view' : 'views' }}
              </span>
            </div>
            <div class="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span class="text-2xl font-bold text-brand">{{
                formatProductPrice(discountedPrice, 'NGN')
              }}</span>
              <span
                v-if="product.discount && product.discount > 0"
                class="text-base text-gray-400 line-through dark:text-neutral-500"
              >
                {{ formatProductPrice(product.price, 'NGN') }}
              </span>
              <span
                v-if="product.discount && product.discount > 0"
                class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                {{ product.discount }}% off
              </span>
            </div>
          </div>

          <!-- Variants -->
          <div v-if="product.variants?.length">
            <p
              class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400"
            >
              Size / Option
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="v in product.variants"
                :key="v.id"
                :disabled="v.stock === 0"
                class="min-h-[44px] touch-manipulation rounded-xl border-2 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40"
                :class="
                  selectedVariantId === v.id
                    ? 'border-brand bg-brand/5 text-brand'
                    : 'border-gray-200 text-gray-700 hover:border-gray-400 dark:border-neutral-700 dark:text-neutral-300'
                "
                @click="selectedVariantId = v.id"
              >
                {{ v.size }}
                <span
                  v-if="v.price && v.price !== product.price"
                  class="ml-1 text-[11px] opacity-60"
                >
                  +{{ formatProductPrice(v.price - product.price, 'NGN') }}
                </span>
              </button>
            </div>
          </div>

          <!-- Stock indicator -->
          <p
            v-if="selectedVariant"
            class="text-xs"
            :class="
              selectedVariant.stock > 5
                ? 'text-green-600'
                : selectedVariant.stock > 0
                  ? 'text-amber-600'
                  : 'text-red-500'
            "
          >
            <Icon name="mdi:circle" size="10" class="mr-1" />
            {{
              selectedVariant.stock > 5
                ? 'In stock'
                : selectedVariant.stock > 0
                  ? `Only ${selectedVariant.stock} left`
                  : 'Out of stock'
            }}
          </p>

          <!-- Qty + Add to cart -->
          <div class="flex items-center gap-3">
            <div
              class="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-neutral-700"
            >
              <button
                class="touch-manipulation px-3 py-3 text-lg font-bold text-gray-600 hover:text-brand dark:text-neutral-400"
                @click="qty = Math.max(1, qty - 1)"
              >
                −
              </button>
              <span
                class="w-8 text-center text-sm font-bold text-gray-900 dark:text-neutral-100"
                >{{ qty }}</span
              >
              <button
                class="touch-manipulation px-3 py-3 text-lg font-bold text-gray-600 hover:text-brand dark:text-neutral-400"
                @click="qty++"
              >
                +
              </button>
            </div>
            <BaseButton
              variant="primary"
              class="flex-1 touch-manipulation py-3.5"
              :loading="addingToCart"
              :disabled="
                addingToCart ||
                !selectedVariantId ||
                selectedVariant?.stock === 0
              "
              @click="handleAddToCart"
            >
              <Icon
                v-if="!addingToCart"
                name="mdi:cart-plus"
                size="16"
                class="mr-1"
              />
              {{ addingToCart ? 'Adding…' : 'Add to Cart' }}
            </BaseButton>
          </div>

          <!-- Share / Copy link / Ask Dasah -->
          <div class="flex gap-2">
            <BaseButton
              variant="secondary"
              size="sm"
              class="flex-1 touch-manipulation"
              @click="copyLink"
            >
              <Icon
                :name="copied ? 'mdi:check' : 'mdi:link-variant'"
                size="15"
                class="mr-1"
              />
              {{ copied ? 'Copied!' : 'Copy link' }}
            </BaseButton>
            <BaseButton
              variant="secondary"
              size="sm"
              class="flex-1 touch-manipulation"
              @click="handleShare"
            >
              <Icon name="mdi:share-variant-outline" size="15" class="mr-1" />
              Share
            </BaseButton>
            <BaseButton
              variant="secondary"
              size="sm"
              class="touch-manipulation px-3"
              title="Ask Dasah about this product"
              @click="askDasah"
            >
              <Icon name="mdi:robot-happy-outline" size="16" />
            </BaseButton>
          </div>

          <!-- Affiliate link panel — visible only to enrolled affiliates -->
          <div
            v-if="isEnrolled && affiliateUrl"
            class="rounded-2xl border border-brand/20 bg-brand/5 p-4 dark:border-brand/30 dark:bg-brand/10"
          >
            <div class="mb-2 flex items-center gap-2">
              <Icon name="mdi:link-variant-plus" size="15" class="text-brand" />
              <p class="text-xs font-bold uppercase tracking-wide text-brand">
                Your Affiliate Link
              </p>
            </div>
            <p class="mb-3 text-xs text-gray-500 dark:text-neutral-400">
              Share this link to earn a commission on every sale you refer.
            </p>
            <div
              class="flex items-center gap-2 rounded-xl border border-brand/20 bg-white px-3 py-2 dark:bg-neutral-900"
            >
              <span
                class="flex-1 truncate text-xs text-gray-600 dark:text-neutral-400"
              >
                {{ affiliateUrl }}
              </span>
              <BaseButton
                variant="primary"
                size="xs"
                class="shrink-0"
                @click="copyAffiliateLink"
              >
                <Icon
                  :name="copiedAffiliate ? 'mdi:check' : 'mdi:content-copy'"
                  size="13"
                  class="mr-1"
                />
                {{ copiedAffiliate ? 'Copied!' : 'Copy' }}
              </BaseButton>
            </div>
          </div>

          <!-- Trust & protection -->
          <div class="grid grid-cols-2 gap-2">
            <div class="trust-chip">
              <Icon
                name="mdi:shield-check-outline"
                size="15"
                class="shrink-0 text-emerald-500"
              />
              Buyer protection
            </div>
            <div class="trust-chip">
              <Icon
                name="mdi:lock-outline"
                size="15"
                class="shrink-0 text-emerald-500"
              />
              Secure payments
            </div>
            <div class="trust-chip">
              <Icon
                name="mdi:backup-restore"
                size="15"
                class="shrink-0 text-emerald-500"
              />
              Easy returns
            </div>
            <div class="trust-chip">
              <Icon
                name="mdi:magnify-scan"
                size="15"
                class="shrink-0 text-emerald-500"
              />
              Inspect on delivery
            </div>
          </div>

          <!-- Product info accordion -->
          <div
            class="divide-y divide-gray-200 overflow-hidden rounded-2xl border border-gray-200 dark:divide-neutral-800 dark:border-neutral-800"
          >
            <!-- Description -->
            <details v-if="product.description" open class="group">
              <summary class="acc-summary">
                Description
                <Icon name="mdi:chevron-down" size="18" class="acc-chev" />
              </summary>
              <div class="px-4 pb-4">
                <!-- eslint-disable-next-line vue/no-v-html — sanitized by DOMPurify -->
                <div
                  class="product-desc text-sm leading-relaxed text-gray-700 dark:text-neutral-300"
                  v-html="safeDescription"
                />
              </div>
            </details>

            <!-- Specifications -->
            <details v-if="productDetails.length" class="group">
              <summary class="acc-summary">
                Specifications
                <Icon name="mdi:chevron-down" size="18" class="acc-chev" />
              </summary>
              <div class="px-4 pb-4">
                <dl class="grid grid-cols-2 gap-x-4 gap-y-3">
                  <template v-for="attr in productDetails" :key="attr.label">
                    <div>
                      <dt
                        class="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500"
                      >
                        {{ attr.label }}
                      </dt>
                      <dd
                        class="mt-0.5 text-sm font-medium text-gray-800 dark:text-neutral-200"
                      >
                        {{ attr.value }}
                      </dd>
                    </div>
                  </template>
                </dl>
                <div
                  v-if="productTags.length"
                  class="mt-3 border-t border-gray-200 pt-3 dark:border-neutral-700"
                >
                  <p
                    class="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500"
                  >
                    Tags
                  </p>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="tag in productTags"
                      :key="tag"
                      class="rounded-full bg-brand/10 px-2.5 py-0.5 text-[11px] font-medium text-brand"
                    >
                      #{{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </details>

            <!-- Delivery & Returns -->
            <details class="group">
              <summary class="acc-summary">
                Delivery &amp; Returns
                <Icon name="mdi:chevron-down" size="18" class="acc-chev" />
              </summary>
              <div
                class="space-y-2 px-4 pb-4 text-[13px] text-gray-600 dark:text-neutral-300"
              >
                <p
                  v-if="product.seller.pod_enabled"
                  class="flex items-start gap-1.5"
                >
                  <Icon
                    name="mdi:truck-delivery-outline"
                    size="15"
                    class="mt-0.5 shrink-0 text-emerald-500"
                  />
                  <span
                    >Pay on delivery available<template
                      v-if="product.seller.pod_delivery_days"
                    >
                      — delivered in {{ product.seller.pod_delivery_days }}–{{
                        product.seller.pod_delivery_days + 2
                      }}
                      days</template
                    >.</span
                  >
                </p>
                <p class="flex items-start gap-1.5">
                  <Icon
                    name="mdi:magnify-scan"
                    size="15"
                    class="mt-0.5 shrink-0 text-emerald-500"
                  />
                  Inspect your order on delivery before you pay (where POD
                  applies).
                </p>
                <p class="flex items-start gap-1.5">
                  <Icon
                    name="mdi:backup-restore"
                    size="15"
                    class="mt-0.5 shrink-0 text-emerald-500"
                  />
                  Returns accepted for damaged or not-as-described items —
                  contact the trader within the return window.
                </p>
                <p class="flex items-start gap-1.5">
                  <Icon
                    name="mdi:shield-check-outline"
                    size="15"
                    class="mt-0.5 shrink-0 text-emerald-500"
                  />
                  Payments are held securely until you confirm your order.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>

      <!-- ── More from this trader ── -->
      <section v-if="traderProducts.length" class="mt-10">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            More from {{ product.seller.store_name }}
          </h2>
          <NuxtLink
            :to="`/sellers/profile/${product.seller.store_slug}`"
            class="text-xs font-semibold text-brand hover:underline"
          >
            Visit store →
          </NuxtLink>
        </div>
        <div
          class="rail-scroll -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2"
        >
          <div
            v-for="p in traderProducts"
            :key="p.id"
            class="w-40 shrink-0 snap-start"
          >
            <ProductCardMini :product="p" @open-detail="goToProduct" />
          </div>
        </div>
      </section>

      <!-- ── More from this market ── -->
      <section v-if="product.square && marketProducts.length" class="mt-10">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">
            More from {{ product.square.name }}
          </h2>
          <NuxtLink
            :to="`/squares/${product.square.slug}`"
            class="text-xs font-semibold text-brand hover:underline"
          >
            Visit market →
          </NuxtLink>
        </div>
        <div
          class="rail-scroll -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2"
        >
          <div
            v-for="p in marketProducts"
            :key="p.id"
            class="w-40 shrink-0 snap-start"
          >
            <ProductCardMini :product="p" @open-detail="goToProduct" />
          </div>
        </div>
      </section>

      <!-- ── Recently viewed ── -->
      <section v-if="recentlyViewedItems.length" class="mt-10">
        <h2 class="mb-3 text-lg font-bold text-gray-900 dark:text-white">
          Recently viewed
        </h2>
        <div
          class="rail-scroll -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2"
        >
          <div
            v-for="p in recentlyViewedItems"
            :key="p.id"
            class="w-40 shrink-0 snap-start"
          >
            <ProductCardMini :product="p" @open-detail="goToProduct" />
          </div>
        </div>
      </section>

      <!-- ── Reviews ── -->
      <div id="reviews" class="mt-10 scroll-mt-24">
        <h2 class="mb-4 text-lg font-bold text-gray-900 dark:text-white">
          Customer Reviews
        </h2>
        <ProductReviews :product-id="product.id" />
      </div>

      <!-- Mobile sticky buy bar (sits above the bottom nav) -->
      <div
        class="fixed inset-x-0 bottom-16 z-30 flex items-center gap-3 border-t border-gray-200 bg-white/95 px-4 py-2.5 backdrop-blur-md md:hidden dark:border-neutral-800 dark:bg-neutral-950/95"
        style="padding-bottom: calc(0.625rem + env(safe-area-inset-bottom, 0px))"
      >
        <p class="min-w-0 flex-1 truncate text-lg font-extrabold text-brand">
          {{ formatProductPrice(discountedPrice, 'NGN') }}
        </p>
        <BaseButton
          variant="primary"
          class="shrink-0 touch-manipulation px-6 py-3"
          :loading="addingToCart"
          :disabled="
            addingToCart || !selectedVariantId || selectedVariant?.stock === 0
          "
          @click="handleAddToCart"
        >
          <Icon
            v-if="!addingToCart"
            name="mdi:cart-plus"
            size="16"
            class="mr-1"
          />
          {{ addingToCart ? 'Adding…' : 'Add to Cart' }}
        </BaseButton>
      </div>
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DOMPurify from 'dompurify'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import VideoPlayer from '~~/layers/core/app/components/VideoPlayer.vue'
import ProductReviews from '~~/layers/commerce/app/components/ProductReviews.vue'
import ProductCardMini from '~~/layers/commerce/app/components/ProductCardMini.vue'
import { useRecentlyViewed } from '~~/layers/commerce/app/composables/useRecentlyViewed'
import { useProductApi } from '~~/layers/commerce/app/services/product.api'
import { useCart } from '~~/layers/commerce/app/composables/useCart'
import { useAffiliate } from '~~/layers/commerce/app/composables/useAffiliate'
import { formatProductPrice } from '~~/shared/utils/currency'
import {
  videoThumb,
  imgDetail,
  imgThumb,
  imgAvatar,
  imgLqip,
} from '~~/layers/core/app/utils/cloudinary'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { useViewTracker } from '~~/layers/core/app/composables/useViewTracker'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useDassaPanel } from '~~/layers/ai/app/composables/useDassaPanel'
import { useShareModal } from '~~/layers/social/app/composables/useShareModal'
import { notify } from '@kyvg/vue3-notification'
import type { Category } from '~~/shared/types/category'
import type { Tag } from '~~/shared/types/tag'
import type { IProduct } from '~~/layers/commerce/app/types/commerce.types'

// ── Route ────────────────────────────────────────────────────────────────────
const route = useRoute()
const slug = computed(() => route.params.slug as string)

// ── Stores / composables ─────────────────────────────────────────────────────
const profileStore = useProfileStore()
const { captureAffiliateRef, affiliateCode, isEnrolled, fetchAffiliateStatus } =
  useAffiliate()
const { openWith: openDassaWith } = useDassaPanel()
const { openShare } = useShareModal()
const { setProductPage } = useSeo()
const { trackProduct } = useViewTracker()

onMounted(() => {
  captureAffiliateRef()
  // 401 for guests — only fetch when logged in
  if (profileStore.isLoggedIn) fetchAffiliateStatus().catch(() => {})
})

// ── Data fetch ───────────────────────────────────────────────────────────────
const { data, pending, status } = useLazyAsyncData(
  `product-${slug.value}`,
  () => useProductApi().getProductBySlug(slug.value),
  { server: false },
)
const product = computed(() => data.value?.data ?? null)

// SEO — registered once in setup(); getters keep it reactive as the product loads.
setProductPage(() => ({
  title: product.value?.title,
  description: product.value?.description,
  imageUrl: product.value?.media?.[0]?.url,
  slug: product.value?.slug,
  sellerName: product.value?.seller?.store_name,
}))

// ── Related discovery: more from this trader / market ────────────────────────
const traderProducts = ref<IProduct[]>([])
const marketProducts = ref<IProduct[]>([])

const loadRelated = async () => {
  const p = product.value
  if (!p) return
  const excludeId = p.id
  try {
    const [tr, mk] = await Promise.all([
      p.seller?.store_slug
        ? $fetch<any>(
            `/api/commerce/products?storeSlug=${p.seller.store_slug}&limit=10`,
          )
        : Promise.resolve(null),
      p.square?.slug
        ? $fetch<any>(
            `/api/commerce/products?squareSlug=${p.square.slug}&sortBy=newest&limit=10`,
          )
        : Promise.resolve(null),
    ])
    traderProducts.value = (tr?.data?.products ?? [])
      .filter((x: IProduct) => x.id !== excludeId)
      .slice(0, 8)
    marketProducts.value = (mk?.data?.products ?? [])
      .filter((x: IProduct) => x.id !== excludeId)
      .slice(0, 8)
  } catch {
    //
  }
}

const goToProduct = (p: IProduct) => navigateTo(`/product/${p.slug}`)

// ── Recently viewed ──────────────────────────────────────────────────────────
const recentlyViewed = useRecentlyViewed()
const recentlyViewedItems = ref<IProduct[]>([])
const captureRecentlyViewed = () => {
  const p = product.value
  if (!p) return
  // Snapshot the list *before* adding the current product.
  recentlyViewedItems.value = recentlyViewed
    .get()
    .filter((x) => x.id !== p.id) as IProduct[]
  recentlyViewed.add(p)
}

// ── Gallery ──────────────────────────────────────────────────────────────────
const currentIndex = ref(0)
const mediaItems = computed(() =>
  (product.value?.media ?? []).filter(
    (m) => !m.isBgMusic && m.type !== 'AUDIO',
  ),
)

watch(
  () => product.value?.id,
  (id) => {
    currentIndex.value = 0
    if (id) {
      trackProduct(id)
      loadRelated()
      captureRecentlyViewed()
    }
  },
)

// ── Variants ─────────────────────────────────────────────────────────────────
const selectedVariantId = ref<number | null>(null)
const selectedVariant = computed(
  () =>
    product.value?.variants?.find((v) => v.id === selectedVariantId.value) ??
    null,
)
const discountedPrice = computed(() => {
  if (!product.value) return 0
  const base = selectedVariant.value?.price ?? product.value.price
  const disc = product.value.discount ?? 0
  return disc > 0 ? Math.round(base * (1 - disc / 100)) : base
})

// Auto-select first available variant when product loads
watch(
  product,
  (p) => {
    if (p?.variants?.length) {
      const first = p.variants.find((v) => v.stock > 0)
      selectedVariantId.value = first?.id ?? p.variants[0]?.id ?? null
    }
  },
  { immediate: true },
)

// ── Delivery card ────────────────────────────────────────────────────────────
const podZones = computed<string[]>(() => {
  const z = product.value?.seller?.pod_zones
  return Array.isArray(z) ? z : []
})

const trustTips = [
  {
    icon: 'mdi:shield-check-outline',
    text: 'Secure checkout — payments are encrypted',
  },
  {
    icon: 'mdi:eye-check-outline',
    text: 'Inspect item before paying on delivery',
  },
  { icon: 'mdi:cash-refund', text: 'Buyer protection on all orders' },
  { icon: 'mdi:account-check-outline', text: 'Only pay when satisfied' },
]

// ── Seller ───────────────────────────────────────────────────────────────────
const sellerMemberSince = computed(() => {
  const d = product.value?.seller?.created_at
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-NG', {
    month: 'short',
    year: 'numeric',
  })
})

// ── Product details grid ─────────────────────────────────────────────────────
const CONDITION_LABELS: Record<string, string> = {
  NEW_WITH_TAGS: 'New with tags',
  LIKE_NEW: 'Like new',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
}

const productDetails = computed(() => {
  if (!product.value) return []
  const attrs: { label: string; value: string }[] = []
  if (product.value.condition)
    attrs.push({
      label: 'Condition',
      value:
        CONDITION_LABELS[product.value.condition] ?? product.value.condition,
    })
  if (product.value.isThrift)
    attrs.push({ label: 'Type', value: 'Pre-loved / Thrift' })
  const cats = (product.value.category ?? [])
    .map((c: { category: Category | null }) => c.category?.name)
    .filter(Boolean)
  if (cats.length) attrs.push({ label: 'Category', value: cats.join(', ') })
  if (product.value.soldCount > 0)
    attrs.push({
      label: 'Units sold',
      value: product.value.soldCount.toLocaleString(),
    })
  return attrs
})

const productTags = computed(() =>
  (product.value?.tags ?? [])
    .map((t: { tag: Tag | null }) => t.tag?.name)
    .filter(Boolean),
)

// ── Description ──────────────────────────────────────────────────────────────
// Raw on SSR (no script execution risk in static HTML), sanitized on client.
const safeDescription = computed(() => {
  if (!product.value?.description) return ''
  if (!import.meta.client) return product.value.description
  return DOMPurify.sanitize(product.value.description)
})

// ── Cart ─────────────────────────────────────────────────────────────────────
const qty = ref(1)
const addingToCart = ref(false)
const { addToCart } = useCart()

const handleAddToCart = async () => {
  if (!selectedVariantId.value) return
  addingToCart.value = true
  try {
    await addToCart(selectedVariantId.value, qty.value)
    notify({ type: 'success', text: 'Added to cart!' })
  } finally {
    addingToCart.value = false
  }
}

// ── Share ────────────────────────────────────────────────────────────────────
const copied = ref(false)
const copiedAffiliate = ref(false)

const baseProductUrl = computed(() =>
  import.meta.client
    ? `${window.location.origin}/product/${slug.value}`
    : `/product/${slug.value}`,
)

const affiliateUrl = computed(() =>
  isEnrolled.value && affiliateCode.value
    ? `${baseProductUrl.value}?ref=${affiliateCode.value}`
    : null,
)

const copyLink = async () => {
  await navigator.clipboard.writeText(baseProductUrl.value).catch(() => {})
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

const copyAffiliateLink = async () => {
  if (!affiliateUrl.value) return
  await navigator.clipboard.writeText(affiliateUrl.value).catch(() => {})
  copiedAffiliate.value = true
  setTimeout(() => {
    copiedAffiliate.value = false
  }, 2000)
}

// Routes through HomeLayout's ShareModal for consistent UX
const handleShare = () =>
  openShare(baseProductUrl.value, product.value?.title ?? '')

// ── Ask Dasah ────────────────────────────────────────────────────────────────
const askDasah = () => {
  if (!product.value) return
  openDassaWith(
    `I'm looking at "${product.value.title}" priced at ${formatProductPrice(discountedPrice.value, 'NGN')}. Can you tell me about it and is it worth buying?`,
  )
}

// ── SEO ──────────────────────────────────────────────────────────────────────
</script>

<style scoped>
.rail-scroll {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.rail-scroll::-webkit-scrollbar {
  display: none;
}
.trust-chip {
  @apply flex items-center gap-1.5 rounded-xl border border-gray-200 px-2.5 py-2 text-[11px] font-medium text-gray-600 dark:border-neutral-800 dark:text-neutral-300;
}
.acc-summary {
  @apply flex cursor-pointer list-none items-center justify-between p-4 text-sm font-bold text-gray-900 dark:text-white;
}
.acc-summary::-webkit-details-marker {
  display: none;
}
.acc-chev {
  @apply text-gray-400 transition-transform duration-200 group-open:rotate-180;
}
.product-desc :deep(p) {
  margin-bottom: 0.6em;
}
.product-desc :deep(p:last-child) {
  margin-bottom: 0;
}
.product-desc :deep(h1),
.product-desc :deep(h2),
.product-desc :deep(h3) {
  font-weight: 700;
  margin: 0.8em 0 0.3em;
}
.product-desc :deep(ul),
.product-desc :deep(ol) {
  padding-left: 1.25rem;
  margin-bottom: 0.6em;
}
.product-desc :deep(ul) {
  list-style-type: disc;
}
.product-desc :deep(ol) {
  list-style-type: decimal;
}
.product-desc :deep(li) {
  margin-bottom: 0.2em;
}
.product-desc :deep(strong) {
  font-weight: 700;
}
.product-desc :deep(em) {
  font-style: italic;
}
.product-desc :deep(a) {
  color: #f02c56;
  text-decoration: underline;
}
</style>
