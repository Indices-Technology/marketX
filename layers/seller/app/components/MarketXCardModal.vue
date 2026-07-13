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
          :seller="seller"
          :product-count="productCount"
          :qr="qr"
          :share-url="shareUrl"
          :display-url="displayUrl"
          :copied="copied"
          @copy="copy"
        />

        <div class="grid grid-cols-2 gap-2.5">
          <BaseButton variant="primary" class="w-full" @click="share">
            <Icon name="solar:share-bold" size="16" />
            Share
          </BaseButton>
          <BaseButton variant="secondary" class="w-full" @click="downloadQr">
            <Icon name="solar:download-minimalistic-linear" size="16" />
            Save QR
          </BaseButton>
        </div>

        <div class="flex items-center justify-center gap-3">
          <a
            v-for="t in shareTargets"
            :key="t.id"
            :href="t.href"
            target="_blank"
            rel="noopener"
            :title="t.label"
            class="flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform hover:scale-105"
            :style="{ background: t.bg }"
          >
            <Icon :name="t.icon" size="18" />
          </a>
        </div>

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
import { watch } from 'vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import MarketXCard from './MarketXCard.vue'
import CardSettingsPanel from './CardSettingsPanel.vue'
import { useStoreCard } from '../composables/useStoreCard'
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
  copied,
  loading,
  displayUrl,
  shareUrl,
  load,
  copy,
  share,
  downloadQr,
  shareTargets,
} = useStoreCard()

watch(
  () => [props.open, props.storeSlug] as const,
  ([open, slug]) => {
    if (open && slug) load(slug)
  },
  { immediate: true },
)

// Reflect saved settings on the local card immediately.
const onSaved = (patch: { cardSettings: CardSettings; store_email: string }) => {
  if (!seller.value) return
  seller.value.cardSettings = patch.cardSettings
  seller.value.store_email = patch.store_email
}
</script>
