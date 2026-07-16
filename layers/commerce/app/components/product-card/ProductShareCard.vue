<template>
  <div
    ref="rootEl"
    class="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl shadow-gray-200/60 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/40"
  >
    <!-- Product image — the hero of a product card. -->
    <div class="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-neutral-800">
      <img
        v-if="coverUrl"
        :src="coverUrl"
        :alt="product.title"
        crossorigin="anonymous"
        class="h-full w-full object-cover"
      />
      <div
        v-else
        class="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand/15 to-brand/5"
      >
        <Icon name="solar:bag-4-linear" size="40" class="text-brand/50" />
      </div>
      <!-- Discount flag -->
      <span
        v-if="product.discount && product.discount > 0"
        class="absolute left-3 top-3 rounded-lg bg-brand px-2 py-1 text-[11px] font-bold text-white shadow-sm"
      >
        {{ product.discount }}% OFF
      </span>
    </div>

    <div class="px-5 pb-5 pt-4">
      <!-- Title + price -->
      <h2
        class="line-clamp-2 font-display text-base font-bold leading-snug text-gray-900 dark:text-white"
      >
        {{ product.title }}
      </h2>
      <div class="mt-1.5 flex items-baseline gap-2">
        <span class="font-display text-xl font-extrabold text-brand">{{ priceText }}</span>
        <span
          v-if="product.discount && product.discount > 0"
          class="text-[13px] text-gray-400 line-through dark:text-neutral-500"
        >
          {{ fmt(product.price) }}
        </span>
      </div>

      <!-- Seller row -->
      <div v-if="product.seller" class="mt-3 flex items-center gap-2">
        <div
          class="h-7 w-7 shrink-0 overflow-hidden rounded-full border border-gray-200 bg-white dark:border-neutral-700"
        >
          <img
            v-if="product.seller.store_logo"
            :src="imgAvatar(product.seller.store_logo)"
            :alt="product.seller.store_name"
            crossorigin="anonymous"
            class="h-full w-full object-cover"
          />
          <div v-else class="flex h-full w-full items-center justify-center bg-brand">
            <Icon name="solar:shop-2-bold" size="14" class="text-white" />
          </div>
        </div>
        <span class="min-w-0 truncate text-[13px] font-semibold text-gray-700 dark:text-neutral-300">
          {{ product.seller.store_name || product.seller.store_slug }}
        </span>
        <Icon
          v-if="product.seller.is_verified"
          name="solar:verified-check-bold"
          size="15"
          class="shrink-0 text-blue-500"
        />
        <button
          v-if="product.seller.publicId"
          class="ml-auto shrink-0 whitespace-nowrap rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
          :title="`Copy ${product.seller.publicId}`"
          @click="emit('copy', product.seller.publicId, 'Seller ID')"
        >
          {{ product.seller.publicId }}
        </button>
      </div>

      <!-- Affiliate earn strip — the sharer's own incentive. Shown in their live
           preview only; `capture-hide` keeps it OUT of the downloaded/shared card
           so the public never sees the commission line. -->
      <div
        v-if="affiliateActive && commissionText"
        class="capture-hide mt-3 flex items-center gap-2 rounded-xl bg-brand/5 px-3 py-2 dark:bg-brand/10"
      >
        <Icon name="solar:hand-money-linear" size="16" class="shrink-0 text-brand" />
        <p class="text-[12px] font-semibold text-brand">
          You earn {{ commissionText }} on every sale from this link
        </p>
      </div>

      <!-- QR + link -->
      <div class="mt-4 flex items-center gap-3">
        <div
          class="shrink-0 rounded-xl border border-gray-200 bg-white p-1.5 dark:border-neutral-700"
        >
          <img v-if="qr" :src="qr" alt="Product QR code" class="h-[76px] w-[76px]" />
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
            class="mt-0.5 flex max-w-full items-start gap-1 text-left text-[13px] font-bold text-brand"
            :title="`Copy ${shareUrl}`"
            @click="emit('copy', shareUrl, 'Link')"
          >
            <span class="break-all">{{ displayUrl }}</span>
            <Icon
              :name="copied === 'Link' ? 'solar:check-circle-bold' : 'solar:copy-linear'"
              size="13"
              class="mt-0.5 shrink-0 capture-hide"
            />
          </button>
          <p class="mt-1 text-[10px] text-gray-400 dark:text-neutral-500">
            Powered by MarketX
          </p>
        </div>
      </div>

      <!-- Public affiliate invite — subtle, appears on the shared card so
           recipients know they can share & earn too. (Not the owner's private
           commission line above, which is capture-hidden.) -->
      <div
        class="mt-3 flex items-center justify-center gap-1.5 border-t border-gray-100 pt-2.5 dark:border-neutral-800"
      >
        <Icon
          name="solar:hand-money-linear"
          size="12"
          class="shrink-0 text-gray-400 dark:text-neutral-500"
        />
        <p class="text-[10px] font-medium text-gray-400 dark:text-neutral-500">
          Share products like this &amp; earn — become a MarketX affiliate
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  imgAvatar,
  imgDetail,
  videoThumb,
} from '~~/layers/core/app/utils/cloudinary'
import { formatProductPrice } from '~~/shared/utils/currency'

// Exposed so the modal can snapshot the card to a PNG (download / image share).
const rootEl = ref<HTMLElement | null>(null)
defineExpose({ rootEl })

const props = defineProps<{
  product: any
  qr?: string
  shareUrl: string
  displayUrl: string
  priceText: string
  commissionText?: string
  affiliateActive?: boolean
  copied?: string | null
}>()

const emit = defineEmits<{
  (e: 'copy', text: string | null | undefined, label: string): void
}>()

const fmt = (major: number) => formatProductPrice(major, 'NGN')

// Prefer a real image; for a video-only product fall back to a poster frame
// (Cloudinary renders one via videoThumb) so the card never shows a blank cover.
const coverUrl = computed(() => {
  const media = (props.product?.media ?? []).filter((m: any) => !m?.isBgMusic)
  const img = media.find((m: any) => m?.type !== 'VIDEO')
  if (img?.url) return imgDetail(img.url)
  const vid = media.find((m: any) => m?.type === 'VIDEO')
  return vid?.url ? videoThumb(vid.url, { width: 880, height: 660 }) : ''
})
</script>
