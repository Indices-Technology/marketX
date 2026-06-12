<template>
  <HomeLayout :narrow-feed="false" :hide-right-sidebar="false">
    <div
      class="pb-[max(5rem,_calc(1.5rem_+_env(safe-area-inset-bottom)))] md:pb-6"
    >
      <!-- ── SKELETON ──────────────────────────────────────────────────── -->
      <div v-if="pageLoading" class="animate-pulse">
        <div class="-mx-2 h-56 bg-gray-200 sm:-mx-6 dark:bg-neutral-800" />
        <div class="px-3 sm:px-5">
          <div class="-mt-14 flex items-end gap-4">
            <div
              class="h-20 w-20 shrink-0 rounded-2xl border-4 border-white bg-gray-200 dark:border-neutral-950 dark:bg-neutral-700"
            />
            <div class="flex-1 space-y-2 pb-2">
              <div
                class="h-6 w-48 rounded-lg bg-gray-200 dark:bg-neutral-700"
              />
              <div class="h-4 w-28 rounded bg-gray-200 dark:bg-neutral-700" />
            </div>
          </div>
          <div class="mt-5 grid grid-cols-3 gap-3">
            <div
              v-for="i in 3"
              :key="i"
              class="h-20 rounded-2xl bg-gray-100 dark:bg-neutral-800"
            />
          </div>
          <div
            class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            <div
              v-for="i in 8"
              :key="i"
              class="aspect-[3/4] rounded-2xl bg-gray-100 dark:bg-neutral-800"
            />
          </div>
        </div>
      </div>

      <!-- ── ERROR ─────────────────────────────────────────────────────── -->
      <div
        v-else-if="loadError || !seller"
        class="flex flex-col items-center justify-center px-4 py-32 text-center"
      >
        <div
          class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
        >
          <Icon
            name="mdi:store-off-outline"
            size="36"
            class="text-gray-400 dark:text-neutral-600"
          />
        </div>
        <h2 class="text-2xl font-black text-gray-900 dark:text-neutral-100">
          Store not found
        </h2>
        <p class="mt-2 max-w-xs text-sm text-gray-500 dark:text-neutral-400">
          This store doesn't exist or may have been removed.
        </p>
        <NuxtLink
          to="/sellers"
          class="mt-6 inline-flex items-center gap-2 rounded-2xl bg-brand px-7 py-3 text-sm font-bold text-white shadow-lg shadow-brand/25 transition-all hover:bg-brand-dark"
        >
          Browse all stores
        </NuxtLink>
      </div>

      <!-- ── PROFILE ────────────────────────────────────────────────────── -->
      <div v-else>
        <!-- Banner -->
        <div class="group relative -mx-4 h-44 overflow-hidden sm:-mx-6 sm:h-56">
          <img
            v-if="seller.store_banner"
            :src="
              cloudinaryUrl(seller.store_banner, {
                width: 1200,
                height: 400,
                crop: 'fill',
              })
            "
            :alt="`${seller.store_name} banner`"
            class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div
            v-else
            class="h-full w-full bg-gradient-to-br from-brand via-[#9b2c56] to-purple-700"
          >
            <!-- Subtle pattern overlay -->
            <div
              class="absolute inset-0 opacity-10"
              style="
                background-image: radial-gradient(
                    circle at 20% 50%,
                    white 1px,
                    transparent 1px
                  ),
                  radial-gradient(circle at 80% 20%, white 1px, transparent 1px),
                  radial-gradient(circle at 60% 80%, white 1px, transparent 1px);
                background-size: 60px 60px;
              "
            ></div>
          </div>
          <!-- Bottom gradient fade -->
          <div
            class="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent dark:from-neutral-950/80"
          />
        </div>

        <!-- Header -->
        <div class="px-3 sm:px-5">
          <div
            class="relative -mt-10 flex items-end justify-between gap-3 sm:-mt-16"
          >
            <!-- Logo -->
            <div class="relative shrink-0">
              <div
                class="h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-xl sm:h-24 sm:w-24 dark:border-neutral-950 dark:bg-neutral-900"
              >
                <img
                  v-if="seller.store_logo"
                  :src="imgAvatar(seller.store_logo)"
                  :alt="seller.store_name"
                  class="h-full w-full object-cover"
                />
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center bg-brand"
                >
                  <Icon name="mdi:storefront" size="40" class="text-white" />
                </div>
              </div>
              <!-- Verified badge -->
              <div
                v-if="seller.is_verified"
                class="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow-md dark:border-neutral-950"
                title="Verified Store"
              >
                <Icon name="mdi:check-bold" size="13" class="text-white" />
              </div>
            </div>

            <!-- Desktop action buttons (right-aligned, bottom of banner) -->
            <div class="hidden items-center gap-2 pb-1 sm:flex">
              <!-- Message Store button — only for logged-in non-owners -->
              <button
                v-if="profileStore.isLoggedIn && !isOwnStore"
                :disabled="messageLoading"
                class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                @click="messageStore"
              >
                <Icon
                  v-if="messageLoading"
                  name="eos-icons:loading"
                  size="15"
                  class="animate-spin"
                />
                <Icon v-else name="mdi:message-outline" size="15" />
                Message
              </button>
              <button
                v-if="profileStore.isLoggedIn"
                :disabled="followLoading"
                class="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-60"
                :class="
                  isFollowing
                    ? 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                    : 'bg-brand text-white shadow-lg shadow-brand/25 hover:bg-brand-dark'
                "
                @click="toggleFollow"
              >
                <Icon
                  v-if="followLoading"
                  name="eos-icons:loading"
                  size="15"
                  class="animate-spin"
                />
                <Icon
                  v-else
                  :name="isFollowing ? 'mdi:account-check' : 'mdi:account-plus'"
                  size="15"
                />
                {{ isFollowing ? 'Following' : 'Follow' }}
              </button>
              <button
                class="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                title="Share store"
                @click="shareStore"
              >
                <Icon name="mdi:share-variant-outline" size="18" />
              </button>
              <a
                v-if="safeStoreWebsite"
                :href="safeStoreWebsite"
                target="_blank"
                rel="noopener"
                class="rounded-xl border border-gray-200 bg-white p-2.5 text-gray-600 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                title="Visit website"
              >
                <Icon name="mdi:web" size="18" />
              </a>
            </div>
          </div>

          <!-- Store name + meta -->
          <div class="mt-3">
            <div class="flex flex-wrap items-center gap-2">
              <h1
                class="text-xl font-black text-gray-900 sm:text-3xl dark:text-neutral-100"
              >
                {{ seller.store_name }}
              </h1>
              <span
                class="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-brand"
              >
                {{ (seller as any).default_currency ?? 'NGN' }}
              </span>
              <span
                v-if="seller.is_verified"
                class="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-black text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              >
                <Icon name="mdi:check-decagram" size="11" />
                Verified
              </span>
            </div>

            <p
              class="mt-0.5 text-sm font-medium text-gray-400 dark:text-neutral-500"
            >
              @{{ seller.store_slug }}
            </p>

            <div
              v-if="seller.store_description"
              class="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-gray-600 dark:text-neutral-400"
            >
              {{ seller.store_description }}
            </div>

            <!-- Meta row -->
            <div
              class="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-neutral-500"
            >
              <NuxtLink
                v-if="
                  seller.store_location &&
                  (seller as any).latitude &&
                  (seller as any).longitude
                "
                :to="`/map?store=${seller.store_slug}`"
                class="flex items-center gap-1 text-brand hover:underline"
                title="View on map"
              >
                <Icon name="mdi:map-marker" size="13" class="text-brand" />
                {{ seller.store_location }}
                <Icon
                  name="mdi:map-search-outline"
                  size="11"
                  class="opacity-60"
                />
              </NuxtLink>
              <span
                v-else-if="seller.store_location"
                class="flex items-center gap-1"
              >
                <Icon
                  name="mdi:map-marker-outline"
                  size="13"
                  class="text-brand"
                />
                {{ seller.store_location }}
              </span>
              <span class="flex items-center gap-1">
                <Icon
                  name="mdi:calendar-outline"
                  size="13"
                  class="text-brand"
                />
                Joined {{ formatDate(seller.created_at) }}
              </span>
              <a
                v-if="safeStoreWebsite"
                :href="safeStoreWebsite"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-1 text-brand hover:underline sm:hidden"
              >
                <Icon name="mdi:web" size="13" />
                Website
              </a>
            </div>
          </div>

          <!-- Stats strip -->
          <div class="mt-5 grid grid-cols-3 gap-3">
            <div
              class="rounded-2xl border border-gray-200 bg-white px-3 py-4 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p
                class="text-xl font-black text-gray-900 sm:text-2xl dark:text-neutral-100"
              >
                {{ formatNumber(total) }}
              </p>
              <p
                class="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500"
              >
                Products
              </p>
            </div>
            <div
              class="rounded-2xl border border-gray-200 bg-white px-3 py-4 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p
                class="text-xl font-black text-gray-900 sm:text-2xl dark:text-neutral-100"
              >
                {{ formatNumber(seller.followers_count || 0) }}
              </p>
              <p
                class="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500"
              >
                Followers
              </p>
            </div>
            <div
              class="rounded-2xl border border-gray-200 bg-white px-3 py-4 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div class="flex items-center justify-center gap-1">
                <p
                  class="text-xl font-black text-gray-900 sm:text-2xl dark:text-neutral-100"
                >
                  {{
                    (seller as any).averageRating
                      ? (seller as any).averageRating.toFixed(1)
                      : '—'
                  }}
                </p>
                <Icon
                  v-if="(seller as any).averageRating"
                  name="mdi:star"
                  size="16"
                  class="mt-0.5 text-yellow-400"
                />
              </div>
              <p
                class="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500"
              >
                {{
                  (seller as any).totalReviews
                    ? `${(seller as any).totalReviews} Reviews`
                    : 'Rating'
                }}
              </p>
            </div>
          </div>

          <!-- Mobile action buttons -->
          <div class="mt-4 flex gap-2 sm:hidden">
            <!-- Message Store (mobile) -->
            <button
              v-if="profileStore.isLoggedIn && !isOwnStore"
              class="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
              :disabled="messageLoading"
              @click="messageStore"
            >
              <Icon
                v-if="messageLoading"
                name="eos-icons:loading"
                size="15"
                class="animate-spin"
              />
              <Icon v-else name="mdi:message-outline" size="15" />
              Message
            </button>
            <button
              v-if="profileStore.isLoggedIn"
              :disabled="followLoading"
              class="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all disabled:opacity-60"
              :class="
                isFollowing
                  ? 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-200'
                  : 'bg-brand text-white shadow-lg shadow-brand/25'
              "
              @click="toggleFollow"
            >
              <Icon
                v-if="followLoading"
                name="eos-icons:loading"
                size="15"
                class="animate-spin"
              />
              <Icon
                v-else
                :name="isFollowing ? 'mdi:account-check' : 'mdi:account-plus'"
                size="15"
              />
              {{ isFollowing ? 'Following' : 'Follow' }}
            </button>
            <button
              class="rounded-xl border border-gray-200 bg-white px-4 py-3 text-gray-600 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
              @click="shareStore"
            >
              <Icon name="mdi:share-variant-outline" size="18" />
            </button>
          </div>
        </div>

        <!-- ── WALL CONTENT ──────────────────────────────────────────────── -->
        <div class="px-3 pt-5 sm:px-5">
          <!-- Filter pills -->
          <div class="scrollbar-hide mb-4 flex gap-2 overflow-x-auto pb-1">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all"
              :class="
                activeTab === tab.key
                  ? 'bg-brand text-white shadow-sm shadow-brand/30'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
              "
              @click="activeTab = tab.key"
            >
              <Icon :name="tab.icon" size="13" />
              {{ tab.label }}
            </button>
          </div>

          <!-- WALL (default) ───────────────────────────────────────────────── -->
          <div v-show="activeTab === 'wall'" class="max-w-2xl space-y-3">
            <!-- Composer — visible for logged-in non-owners -->
            <WallShoutoutComposer
              v-if="profileStore.isLoggedIn && !isOwnStore"
              type="STORE"
              :slug="storeSlug"
              placeholder="Leave a shoutout on this store's wall…"
              @posted="onShoutoutPosted"
            />

            <!-- Skeleton -->
            <div v-if="wallLoading && !wallPosts.length" class="space-y-3">
              <div
                v-for="i in 3"
                :key="i"
                class="animate-pulse rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="h-9 w-9 rounded-xl bg-gray-100 dark:bg-neutral-800"
                  />
                  <div class="flex-1 space-y-1.5">
                    <div
                      class="h-3 w-28 rounded bg-gray-100 dark:bg-neutral-800"
                    />
                    <div
                      class="h-2.5 w-16 rounded bg-gray-100 dark:bg-neutral-800"
                    />
                  </div>
                </div>
                <div
                  class="mt-3 h-12 rounded-lg bg-gray-50 dark:bg-neutral-800"
                />
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-else-if="!wallLoading && !wallPosts.length"
              class="flex flex-col items-center justify-center gap-3 py-20 text-center"
            >
              <div
                class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-neutral-800"
              >
                <Icon
                  name="mdi:bulletin-board"
                  size="30"
                  class="text-gray-300 dark:text-neutral-600"
                />
              </div>
              <p class="text-sm font-bold text-gray-500 dark:text-neutral-400">
                No posts yet
              </p>
              <p
                v-if="!isOwnStore && profileStore.isLoggedIn"
                class="text-xs text-gray-400 dark:text-neutral-500"
              >
                Be the first to leave a shoutout!
              </p>
            </div>

            <!-- Wall posts -->
            <WallPostCard
              v-for="post in wallPosts"
              :key="post.id"
              :post="post"
              wall-type="STORE"
              :wall-slug="storeSlug"
              :is-wall-owner="isOwnStore"
              :owner-avatar="seller?.store_logo ?? null"
              @deleted="onWallPostDeleted"
            />

            <!-- Infinite scroll sentinel -->
            <div ref="wallTrigger" class="h-8" />

            <!-- Loading more -->
            <div
              v-if="wallLoading && wallPosts.length"
              class="flex items-center justify-center gap-2 py-4"
            >
              <Icon
                name="eos-icons:loading"
                size="18"
                class="animate-spin text-brand"
              />
              <span class="text-sm text-gray-400 dark:text-neutral-500"
                >Loading more…</span
              >
            </div>
          </div>

          <!-- PRODUCTS ──────────────────────────────────────────────────── -->
          <div v-show="activeTab === 'products'">
            <!-- Product skeleton -->
            <div
              v-if="productsLoading && !products.length"
              class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
            >
              <div
                v-for="i in 8"
                :key="i"
                class="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div class="aspect-[3/4] bg-gray-100 dark:bg-neutral-800" />
                <div class="space-y-2 p-3">
                  <div
                    class="h-3 w-3/4 rounded bg-gray-100 dark:bg-neutral-800"
                  />
                  <div
                    class="h-3 w-1/2 rounded bg-gray-100 dark:bg-neutral-800"
                  />
                </div>
              </div>
            </div>

            <!-- Empty -->
            <div
              v-else-if="!productsLoading && !products.length"
              class="flex flex-col items-center justify-center gap-3 py-20 text-center"
            >
              <div
                class="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-neutral-800"
              >
                <Icon
                  name="mdi:package-variant-closed"
                  size="30"
                  class="text-gray-300 dark:text-neutral-600"
                />
              </div>
              <p class="text-sm font-bold text-gray-500 dark:text-neutral-400">
                No products yet
              </p>
            </div>

            <!-- Grid -->
            <div
              v-else
              class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
            >
              <ProductCardMini
                v-for="product in products"
                :key="product.id"
                :product="product"
                @open-detail="selectedProduct = product"
                @quick-add="quickAdd"
                @market="marketProduct = $event"
              />
            </div>

            <!-- Infinite scroll trigger -->
            <div ref="trigger" class="mt-2 h-12" />

            <!-- Loading more -->
            <div
              v-if="productsLoading && products.length"
              class="flex items-center justify-center gap-2 py-6"
            >
              <Icon
                name="eos-icons:loading"
                size="20"
                class="animate-spin text-brand"
              />
              <span class="text-sm text-gray-400 dark:text-neutral-500"
                >Loading more…</span
              >
            </div>
          </div>

          <!-- ABOUT ──────────────────────────────────────────────────────── -->
          <div v-show="activeTab === 'about'" class="max-w-2xl space-y-4">
            <!-- Description card -->
            <div
              class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <p
                class="mb-3 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500"
              >
                About this store
              </p>
              <p
                class="whitespace-pre-line text-sm leading-relaxed text-gray-700 dark:text-neutral-300"
              >
                {{
                  seller.store_description ||
                  "This store hasn't added a description yet."
                }}
              </p>
            </div>

            <!-- Info grid -->
            <div class="grid gap-3 sm:grid-cols-2">
              <div
                v-if="seller.store_location"
                class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10"
                >
                  <Icon
                    name="mdi:map-marker-outline"
                    size="18"
                    class="text-brand"
                  />
                </div>
                <div>
                  <p
                    class="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-neutral-500"
                  >
                    Location
                  </p>
                  <p
                    class="text-sm font-bold text-gray-900 dark:text-neutral-100"
                  >
                    {{ seller.store_location }}
                  </p>
                </div>
              </div>

              <div
                class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10"
                >
                  <Icon
                    name="mdi:calendar-check-outline"
                    size="18"
                    class="text-brand"
                  />
                </div>
                <div>
                  <p
                    class="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-neutral-500"
                  >
                    Member since
                  </p>
                  <p
                    class="text-sm font-bold text-gray-900 dark:text-neutral-100"
                  >
                    {{ formatDate(seller.created_at) }}
                  </p>
                </div>
              </div>

              <div
                v-if="seller.store_phone"
                class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10"
                >
                  <Icon name="mdi:phone-outline" size="18" class="text-brand" />
                </div>
                <div>
                  <p
                    class="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-neutral-500"
                  >
                    Phone
                  </p>
                  <p
                    class="text-sm font-bold text-gray-900 dark:text-neutral-100"
                  >
                    {{ seller.store_phone }}
                  </p>
                </div>
              </div>

              <div
                v-if="safeStoreWebsite"
                class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10"
                >
                  <Icon name="mdi:web" size="18" class="text-brand" />
                </div>
                <div class="min-w-0">
                  <p
                    class="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-neutral-500"
                  >
                    Website
                  </p>
                  <a
                    :href="safeStoreWebsite"
                    target="_blank"
                    rel="noopener"
                    class="block truncate text-sm font-bold text-brand hover:underline"
                  >
                    {{ seller.store_website.replace(/^https?:\/\//, '') }}
                  </a>
                </div>
              </div>

              <div
                class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50"
                >
                  <Icon
                    name="mdi:currency-usd"
                    size="18"
                    class="text-amber-500"
                  />
                </div>
                <div>
                  <p
                    class="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-neutral-500"
                  >
                    Currency
                  </p>
                  <p
                    class="text-sm font-bold text-gray-900 dark:text-neutral-100"
                  >
                    {{ (seller as any).default_currency ?? 'NGN' }}
                  </p>
                </div>
              </div>

              <div
                class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50"
                >
                  <Icon
                    name="mdi:package-variant"
                    size="18"
                    class="text-emerald-500"
                  />
                </div>
                <div>
                  <p
                    class="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-neutral-500"
                  >
                    Total products
                  </p>
                  <p
                    class="text-sm font-bold text-gray-900 dark:text-neutral-100"
                  >
                    {{ total.toLocaleString() }} listed
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- REVIEWS ────────────────────────────────────────────────────── -->
          <div v-show="activeTab === 'reviews'" class="max-w-2xl">
            <SellerReviews :store-slug="storeSlug" :is-own-store="isOwnStore" />
          </div>
        </div>
      </div>
    </div>

    <!-- ── MODALS ─────────────────────────────────────────────────────── -->
    <ProductDetailModal
      :product="selectedProduct"
      @close="selectedProduct = null"
    />
    <ProductMarketModal
      :is-open="!!marketProduct"
      :product="marketProduct"
      @close="marketProduct = null"
    />
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { useRoute } from 'vue-router'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import ProductCardMini from '~~/layers/commerce/app/components/ProductCardMini.vue'
import ProductDetailModal from '~~/layers/commerce/app/components/modals/ProductDetailModal.vue'
import { imgAvatar, cloudinaryUrl } from '~~/layers/core/app/utils/cloudinary'
import { safeExternalUrl } from '~~/shared/utils/safeUrl'
import ProductMarketModal from '~~/layers/commerce/app/components/modals/ProductMarketModal.vue'
import { useSellerManagement } from '~~/layers/seller/app/composables/useSellerManagement'
import { useProduct } from '~~/layers/commerce/app/composables/useProduct'
import { useAffiliate } from '~~/layers/commerce/app/composables/useAffiliate'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import SellerReviews from '~~/layers/seller/app/components/SellerReviews.vue'
import { useCart } from '~~/layers/commerce/app/composables/useCart'
import { notify } from '@kyvg/vue3-notification'
import type { IProduct } from '~~/layers/commerce/app/types/commerce.types'
import { useSellerStore } from '~~/layers/seller/app/store/seller.store'
import { useChatApi } from '~~/layers/profile/app/services/chat.api'
import { useWallApi } from '~~/layers/social/app/services/wall.api'
import type { IWallPost } from '~~/layers/social/app/services/wall.api'
import WallShoutoutComposer from '~~/layers/social/app/components/wall/WallShoutoutComposer.vue'
import WallPostCard from '~~/layers/social/app/components/wall/WallPostCard.vue'

const route = useRoute()
const storeSlug =
  (route.params.storeSlug as string) || (route.params.store_slug as string)

const {
  loadPublicSeller,
  currentSeller,
  getFollowStatus,
  followSeller,
  unfollowSeller,
} = useSellerManagement()
const { fetchSellerProducts, isLoading: productsLoading } = useProduct()
const profileStore = useProfileStore()
const { addToCart } = useCart()

const pageLoading = ref(true)
const loadError = ref(false)
const activeTab = ref('wall')
const seller = computed(() => currentSeller.value)
// Render-time guard — neutralizes any javascript:/data: URL persisted before
// input validation was tightened (stored-XSS defense-in-depth)
const safeStoreWebsite = computed(() => safeExternalUrl(seller.value?.store_website))

watch(seller, (s) => {
  if (s) useSeo().setStorePage(s)
}, { immediate: true })

const isFollowing = ref(false)
const followLoading = ref(false)
const messageLoading = ref(false)

const sellerStore = useSellerStore()

// True when the logged-in user owns this store
const isOwnStore = computed(() =>
  sellerStore.sellers?.some((s: any) => s.storeSlug === storeSlug.value),
)

const products = ref<IProduct[]>([])
const total = ref(0)
const offset = ref(0)
const LIMIT = 24
const hasMore = computed(() => products.value.length < total.value)

const selectedProduct = ref<IProduct | null>(null)
const marketProduct = ref<IProduct | null>(null)
const trigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const tabs = [
  { key: 'wall', label: 'All', icon: 'mdi:view-dashboard-outline' },
  { key: 'products', label: 'Products', icon: 'mdi:grid' },
  { key: 'reviews', label: 'Reviews', icon: 'mdi:star-outline' },
  { key: 'about', label: 'About', icon: 'mdi:information-outline' },
]

// ── Wall ─────────────────────────────────────────────────────────────────────
const wallPosts = ref<IWallPost[]>([])
const wallLoading = ref(false)
const wallHasMore = ref(false)
const wallOffset = ref(0)
const WALL_LIMIT = 20
let wallTrigger = ref<HTMLElement | null>(null)
let wallObserver: IntersectionObserver | null = null

const loadWall = async (reset = false) => {
  if (wallLoading.value) return
  if (reset) {
    wallPosts.value = []
    wallOffset.value = 0
  }
  wallLoading.value = true
  try {
    const res = await useWallApi().getWall('STORE', storeSlug, {
      filter: 'all',
      limit: WALL_LIMIT,
      offset: wallOffset.value,
    })
    wallPosts.value.push(...(res.data ?? []))
    wallHasMore.value = res.meta?.hasMore ?? false
    wallOffset.value += res.data?.length ?? 0
  } catch {
    /* silent */
  } finally {
    wallLoading.value = false
  }
}

const onShoutoutPosted = (post: IWallPost) => {
  wallPosts.value.unshift(post)
}

const onWallPostDeleted = (postId: string) => {
  wallPosts.value = wallPosts.value.filter((p) => p.id !== postId)
}

const loadProducts = async (reset = false) => {
  if (reset) {
    products.value = []
    offset.value = 0
  }
  if (productsLoading.value) return
  try {
    const result = (await fetchSellerProducts(storeSlug, {
      status: 'PUBLISHED',
      limit: LIMIT,
      offset: offset.value,
    })) as any
    const incoming = result?.products ?? result?.data ?? []
    products.value.push(...incoming)
    total.value = result?.total ?? result?.meta?.total ?? 0
    offset.value += incoming.length
  } catch {
    /* silent */
  }
}

const messageStore = async () => {
  if (!seller.value?.id) return
  messageLoading.value = true
  try {
    const res = await useChatApi().createStoreConversation(seller.value.id)
    const conversationId = res?.data?.id
    if (conversationId) {
      await navigateTo(`/messages/${conversationId}`)
    }
  } catch {
    notify({ type: 'error', text: 'Could not open conversation' })
  } finally {
    messageLoading.value = false
  }
}

const toggleFollow = async () => {
  if (followLoading.value) return
  followLoading.value = true
  try {
    if (isFollowing.value) {
      await unfollowSeller(storeSlug)
      isFollowing.value = false
      if (currentSeller.value)
        (currentSeller.value as any).followers_count = Math.max(
          0,
          ((currentSeller.value as any).followers_count ?? 0) - 1,
        )
    } else {
      await followSeller(storeSlug)
      isFollowing.value = true
      if (currentSeller.value)
        (currentSeller.value as any).followers_count =
          ((currentSeller.value as any).followers_count ?? 0) + 1
    }
  } catch (e: any) {
    notify({
      type: 'error',
      text: e.message || 'Failed to update follow status',
    })
  } finally {
    followLoading.value = false
  }
}

const quickAdd = async (product: IProduct) => {
  const variant = product.variants?.[0]
  if (!variant) {
    selectedProduct.value = product
    return
  }
  try {
    await addToCart(variant.id, 1)
    notify({ type: 'success', text: `${product.title} added to cart` })
  } catch {
    /* useCart handles notification */
  }
}

const shareStore = async () => {
  const url = window.location.href
  const name = seller.value?.store_name ?? 'this store'
  if (navigator.share) {
    try {
      await navigator.share({ title: name, url })
    } catch {
      /* cancelled */
    }
  } else {
    await navigator.clipboard.writeText(url)
    notify({ type: 'success', text: 'Store link copied!' })
  }
}

const formatDate = (d?: string | Date) => {
  if (!d) return 'Recently'
  return new Date(d).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

const formatNumber = (n: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(n)

const { captureAffiliateRef } = useAffiliate()

onMounted(async () => {
  captureAffiliateRef()
  try {
    await loadPublicSeller(storeSlug)
  } catch {
    loadError.value = true
  } finally {
    pageLoading.value = false
  }

  if (!loadError.value) {
    if (profileStore.isLoggedIn) {
      getFollowStatus(storeSlug).then((s) => {
        isFollowing.value = s
      })
    }
    await Promise.all([loadProducts(), loadWall()])
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMore.value && !productsLoading.value)
          loadProducts()
      },
      { rootMargin: '400px' },
    )
    if (trigger.value) observer.observe(trigger.value)
    wallObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && wallHasMore.value && !wallLoading.value)
          loadWall()
      },
      { rootMargin: '400px' },
    )
    if (wallTrigger.value) wallObserver.observe(wallTrigger.value)
  }
})

onUnmounted(() => {
  observer?.disconnect()
  wallObserver?.disconnect()
})
</script>
