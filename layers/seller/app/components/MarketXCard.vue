<template>
  <div
    class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/40"
  >
    <!-- Cover — kept docile (muted + faded into the card) so the logo and text
         lead, not the banner. -->
    <div class="relative h-24 w-full overflow-hidden">
      <img
        v-if="seller.store_banner"
        :src="
          cloudinaryUrl(seller.store_banner, {
            width: 880,
            height: 224,
            crop: 'fill',
          })
        "
        :alt="`${seller.store_name} cover`"
        class="h-full w-full object-cover"
      />
      <div
        v-else
        class="h-full w-full bg-gradient-to-br from-brand/15 to-brand/5 dark:from-brand/20 dark:to-brand/5"
      />
      <!-- Mute the image and fade its lower edge to the card surface. -->
      <div class="absolute inset-0 bg-white/25 dark:bg-black/30" />
      <div
        class="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white via-white/70 to-transparent dark:from-neutral-900 dark:via-neutral-900/70"
      />
    </div>

    <div class="px-5 pb-5">
      <!-- Logo + name -->
      <div class="-mt-9 flex items-end gap-3">
        <div
          class="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md dark:border-neutral-900 dark:bg-neutral-900"
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
            <Icon name="solar:shop-2-bold" size="30" class="text-white" />
          </div>
        </div>
        <div class="min-w-0 flex-1 pb-1">
          <div class="flex items-center gap-1.5">
            <h2
              class="truncate font-display text-lg font-bold text-gray-900 dark:text-white"
            >
              {{ seller.store_name }}
            </h2>
            <Icon
              v-if="seller.is_verified"
              name="solar:verified-check-bold"
              size="18"
              class="shrink-0 text-blue-500"
            />
          </div>
          <p
            v-if="seller.store_location"
            class="flex items-center gap-1 truncate text-[12px] text-gray-500 dark:text-neutral-400"
          >
            <Icon name="solar:map-point-linear" size="12" />
            {{ seller.store_location }}
          </p>
        </div>
      </div>

      <!-- Seller ID + CAC -->
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <button
          class="group inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-[12px] font-bold text-gray-800 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          :title="`Copy ${seller.publicId}`"
          @click="emit('copy', seller.publicId, 'Seller ID')"
        >
          {{ seller.publicId || '—' }}
          <Icon
            :name="
              copied === 'Seller ID'
                ? 'solar:check-circle-bold'
                : 'solar:copy-linear'
            "
            size="13"
            :class="copied === 'Seller ID' ? 'text-emerald-500' : ''"
          />
        </button>
        <span
          v-if="seller.cac_verified"
          class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
        >
          <Icon name="solar:shield-check-bold" size="13" />
          CAC Verified
        </span>
      </div>

      <!-- Description -->
      <p
        v-if="cfg.showDescription && seller.store_description"
        class="mt-3 line-clamp-2 text-[13px] leading-relaxed text-gray-600 dark:text-neutral-400"
      >
        {{ seller.store_description }}
      </p>

      <!-- Stats (each toggleable) -->
      <div
        v-if="cfg.showRating || cfg.showFollowers || cfg.showProducts"
        class="mt-4 flex divide-x divide-gray-100 rounded-2xl bg-gray-50 py-3 text-center dark:divide-neutral-800 dark:bg-neutral-800/50"
      >
        <div v-if="cfg.showRating" class="flex-1">
          <p
            class="font-display text-base font-bold text-gray-900 dark:text-white"
          >
            {{ ratingText }}
          </p>
          <p class="text-[10px] text-gray-400 dark:text-neutral-500">
            {{ reviewCount }} reviews
          </p>
        </div>
        <div v-if="cfg.showFollowers" class="flex-1">
          <p
            class="font-display text-base font-bold text-gray-900 dark:text-white"
          >
            {{ formatNum(seller.followers_count || 0) }}
          </p>
          <p class="text-[10px] text-gray-400 dark:text-neutral-500">
            followers
          </p>
        </div>
        <div v-if="cfg.showProducts" class="flex-1">
          <p
            class="font-display text-base font-bold text-gray-900 dark:text-white"
          >
            {{ formatNum(productCount) }}
          </p>
          <p class="text-[10px] text-gray-400 dark:text-neutral-500">products</p>
        </div>
      </div>

      <!-- Business-card contact (opt-in; values from the store's own fields) -->
      <div v-if="hasContact" class="mt-4 space-y-2">
        <a
          v-if="cfg.showPhone && seller.store_phone"
          :href="`tel:${seller.store_phone}`"
          class="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2 text-[13px] font-medium text-gray-800 transition-colors hover:bg-gray-100 dark:bg-neutral-800/50 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Icon name="solar:phone-linear" size="15" class="text-brand" />
          <span class="truncate">{{ seller.store_phone }}</span>
        </a>
        <a
          v-if="cfg.showEmail && seller.store_email"
          :href="`mailto:${seller.store_email}`"
          class="flex items-center gap-2.5 rounded-xl bg-gray-50 px-3 py-2 text-[13px] font-medium text-gray-800 transition-colors hover:bg-gray-100 dark:bg-neutral-800/50 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <Icon name="solar:letter-linear" size="15" class="text-brand" />
          <span class="truncate">{{ seller.store_email }}</span>
        </a>
        <div
          v-if="cfg.showAddress && seller.store_location"
          class="flex items-start gap-2.5 rounded-xl bg-gray-50 px-3 py-2 text-[13px] font-medium text-gray-800 dark:bg-neutral-800/50 dark:text-neutral-200"
        >
          <Icon
            name="solar:map-point-linear"
            size="15"
            class="mt-0.5 shrink-0 text-brand"
          />
          <span>{{ seller.store_location }}</span>
        </div>
      </div>

      <!-- QR + link -->
      <div class="mt-4 flex items-center gap-3">
        <div
          class="shrink-0 rounded-xl border border-gray-200 bg-white p-1.5 dark:border-neutral-700"
        >
          <img
            v-if="qr"
            :src="qr"
            alt="Store QR code"
            class="h-[76px] w-[76px]"
          />
          <div
            v-else
            class="h-[76px] w-[76px] animate-pulse rounded bg-gray-100 dark:bg-neutral-800"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p
            class="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500"
          >
            Scan or visit
          </p>
          <button
            class="mt-0.5 flex max-w-full items-center gap-1 text-[13px] font-bold text-brand"
            :title="`Copy ${displayUrl}`"
            @click="emit('copy', shareUrl, 'Link')"
          >
            <span class="truncate">{{ displayUrl }}</span>
            <Icon
              :name="
                copied === 'Link' ? 'solar:check-circle-bold' : 'solar:copy-linear'
              "
              size="13"
              class="shrink-0"
            />
          </button>
          <p class="mt-1 text-[10px] text-gray-400 dark:text-neutral-500">
            Powered by MarketX
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { imgAvatar, cloudinaryUrl } from '~~/layers/core/app/utils/cloudinary'
import { resolveCardSettings } from '~~/shared/utils/cardSettings'

const props = defineProps<{
  seller: any
  productCount?: number
  qr?: string
  shareUrl: string
  displayUrl: string
  copied?: string | null
}>()

const emit = defineEmits<{
  (e: 'copy', text: string | null | undefined, label: string): void
}>()

const cfg = computed(() => resolveCardSettings(props.seller?.cardSettings))
const hasContact = computed(
  () =>
    (cfg.value.showPhone && props.seller?.store_phone) ||
    (cfg.value.showEmail && props.seller?.store_email) ||
    (cfg.value.showAddress && props.seller?.store_location),
)

const ratingText = computed(() =>
  props.seller?.averageRating
    ? Number(props.seller.averageRating).toFixed(1)
    : '—',
)
const reviewCount = computed(() => props.seller?.totalReviews ?? 0)

const formatNum = (n = 0) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}
</script>
