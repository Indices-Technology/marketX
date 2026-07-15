<template>
  <BaseModal
    :model-value="open"
    title="Product Card"
    max-width="sm"
    @update:model-value="(v) => !v && emit('close')"
  >
    <div class="space-y-4">
      <template v-if="product">
        <ProductShareCard
          ref="cardRef"
          :product="product"
          :qr="qr"
          :share-url="shareUrl"
          :display-url="displayUrl"
          :price-text="priceText"
          :commission-text="commissionText"
          :affiliate-active="affiliateActive"
          :copied="copied"
          @copy="copy"
        />

        <CardShareActions
          :share="share"
          :download-qr="downloadQr"
          :download-card="downloadCardImage"
          :on-share-target="onShareTarget"
          :downloading="capturing"
          :share-targets="shareTargets"
        />
      </template>

      <BaseEmptyState
        v-else
        icon="solar:bag-4-linear"
        title="Card unavailable"
        description="This product's card could not be loaded."
      />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import CardShareActions from '~~/layers/seller/app/components/CardShareActions.vue'
import ProductShareCard from './ProductShareCard.vue'
import { useProductCard } from '../../composables/useProductCard'
import { useCardCapture } from '~~/layers/seller/app/composables/useCardCapture'

const props = defineProps<{
  open: boolean
  /** Already-loaded product object from the page — no refetch. */
  product: any
}>()
const emit = defineEmits<{ (e: 'close'): void }>()

const {
  product,
  qr,
  copied,
  shareUrl,
  displayUrl,
  priceText,
  commissionText,
  affiliateActive,
  load,
  copy,
  share,
  downloadQr,
  shareTargets,
  caption,
} = useProductCard()

const cardRef = ref<{ rootEl: HTMLElement | null } | null>(null)
const { capture, shareImage, capturing } = useCardCapture()

const slug = () => product.value?.slug || 'product'
const downloadCardImage = () =>
  capture(cardRef.value?.rootEl, `${slug()}-card.png`)
const onShareTarget = (t: { href?: string }) =>
  shareImage(cardRef.value?.rootEl, {
    slug: slug(),
    text: caption.value,
    title: product.value?.title,
    fallbackHref: t.href,
  })

watch(
  () => [props.open, props.product] as const,
  ([open, p]) => {
    if (open && p) load(p)
  },
  { immediate: true },
)
</script>
