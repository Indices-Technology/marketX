<template>
  <BaseModal
    :model-value="open"
    title="Store Card"
    max-width="sm"
    @update:model-value="(v) => !v && emit('close')"
  >
    <div class="space-y-4">
      <div
        v-if="loading"
        class="aspect-[4/5] w-full animate-pulse rounded-3xl bg-gray-100 dark:bg-neutral-800"
      />

      <template v-else-if="seller">
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

        <CardShareActions
          :share="share"
          :download-qr="downloadQr"
          :download-card="downloadCardImage"
          :download-template="downloadTemplateImage"
          :on-share-target="onShareTarget"
          :downloading="capturing"
          :share-targets="shareTargets"
        />

        <CardSettingsPanel v-if="isOwner" :seller="seller" @saved="onSaved" />
      </template>

      <BaseEmptyState
        v-else
        icon="solar:shop-2-linear"
        title="Card unavailable"
        description="This store's card could not be loaded."
      />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import MarketXCard from './MarketXCard.vue'
import CardSettingsPanel from './CardSettingsPanel.vue'
import CardShareActions from './CardShareActions.vue'
import { useStoreCard } from '../composables/useStoreCard'
import { useCardCapture } from '../composables/useCardCapture'
import type { ShareTemplate } from '~~/layers/core/app/utils/cardTemplate'
import type { CardSettings } from '~~/shared/utils/cardSettings'

const props = defineProps<{
  open: boolean
  storeSlug?: string
  isOwner?: boolean
}>()
const emit = defineEmits<{ (e: 'close'): void }>()

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

watch(
  () => [props.open, props.storeSlug] as const,
  ([open, slug]) => {
    if (open && slug) load(slug)
  },
  { immediate: true },
)

// Reflect saved settings on the local card immediately.
const onSaved = (patch: {
  cardSettings: CardSettings
  store_email: string
}) => {
  if (!seller.value) return
  seller.value.cardSettings = patch.cardSettings
  seller.value.store_email = patch.store_email
}
</script>
