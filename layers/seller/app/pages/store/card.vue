<template>
  <HomeLayout :narrow-feed="true" :hide-right-sidebar="true">
    <div class="mx-auto max-w-[440px] px-3 py-5">
      <!-- Header -->
      <div class="mb-4 flex items-center justify-between">
        <div>
          <p class="text-[11px] font-bold uppercase tracking-widest text-brand">
            Your MarketX Card
          </p>
          <h1
            class="font-display text-xl font-bold text-gray-900 dark:text-white"
          >
            Share your store
          </h1>
        </div>
        <button
          v-if="stores.length > 1"
          class="rounded-lg bg-gray-100 px-3 py-1.5 text-[12px] font-semibold text-gray-700 dark:bg-neutral-800 dark:text-neutral-300"
          @click="cycleStore"
        >
          Switch store
        </button>
      </div>

      <div
        v-if="loading"
        class="aspect-[4/5] w-full animate-pulse rounded-3xl bg-gray-100 dark:bg-neutral-800"
      />

      <BaseEmptyState
        v-else-if="!seller"
        icon="solar:shop-2-linear"
        title="No store yet"
        description="Create a store to get your shareable MarketX Card."
      >
        <template #actions>
          <BaseButton
            variant="primary"
            @click="$router.push('/sellers/create')"
          >
            Start selling
          </BaseButton>
        </template>
      </BaseEmptyState>

      <template v-else>
        <MarketXCard
          ref="cardRef"
          :seller="seller"
          :product-count="productCount"
          :qr="qr"
          :trust="trust"
          :share-url="shareUrl"
          :display-url="displayUrl"
          :copied="copied"
          @copy="copy"
        />

        <div class="mt-4">
          <CardShareActions
            :share="share"
            :download-qr="downloadQr"
            :download-card="downloadCardImage"
            :download-template="downloadTemplateImage"
            :on-share-target="onShareTarget"
            :downloading="capturing"
            :share-targets="shareTargets"
          />
        </div>

        <div v-if="isOwner" class="mt-4">
          <CardSettingsPanel :seller="seller" @saved="onSaved" />
        </div>
      </template>
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import MarketXCard from '~~/layers/seller/app/components/MarketXCard.vue'
import CardSettingsPanel from '~~/layers/seller/app/components/CardSettingsPanel.vue'
import CardShareActions from '~~/layers/seller/app/components/CardShareActions.vue'
import { useStoreCard } from '~~/layers/seller/app/composables/useStoreCard'
import { useCardCapture } from '~~/layers/seller/app/composables/useCardCapture'
import { useSellerStore } from '~~/layers/seller/app/store/seller.store'
import type { ShareTemplate } from '~~/layers/core/app/utils/cardTemplate'
import type { CardSettings } from '~~/shared/utils/cardSettings'

const route = useRoute()
const sellerStore = useSellerStore()
const {
  seller,
  productCount,
  qr,
  trust,
  copied,
  loading,
  displayUrl,
  shareUrl,
  load,
  copy,
  share,
  downloadQr,
  shareTargets,
  caption,
} = useStoreCard()

const cardRef = ref<{ rootEl: HTMLElement | null } | null>(null)
const { capture, captureTemplate, shareImage, capturing } = useCardCapture()
const downloadCardImage = () =>
  capture(
    cardRef.value?.rootEl,
    `${seller.value?.store_slug || 'store'}-card.png`,
  )
const downloadTemplateImage = (tpl: ShareTemplate) =>
  captureTemplate(
    cardRef.value?.rootEl,
    tpl,
    seller.value?.store_slug || 'store',
  )
const onShareTarget = (t: { tpl?: ShareTemplate; href?: string }) =>
  shareImage(cardRef.value?.rootEl, {
    tpl: t.tpl,
    slug: seller.value?.store_slug || 'store',
    text: caption.value,
    title: seller.value?.store_name,
    fallbackHref: t.href,
  })

// Which store: ?store=slug, else the logged-in seller's own stores.
const stores = computed(() => sellerStore.sellers ?? [])
const slugOf = (s: any) => s?.storeSlug || s?.store_slug
const storeIndex = ref(0)
const activeSlug = computed(() => {
  const q = route.query.store as string | undefined
  return q || slugOf(stores.value[storeIndex.value])
})

// Owner when the resolved store is one of the current user's stores.
const isOwner = computed(() =>
  stores.value.some((s: any) => slugOf(s) === seller.value?.store_slug),
)

const cycleStore = () => {
  storeIndex.value = (storeIndex.value + 1) % Math.max(1, stores.value.length)
}

const onSaved = (patch: {
  cardSettings: CardSettings
  store_email: string
}) => {
  if (!seller.value) return
  seller.value.cardSettings = patch.cardSettings
  seller.value.store_email = patch.store_email
}

watch(activeSlug, (s) => load(s))
onMounted(() => load(activeSlug.value))
</script>
