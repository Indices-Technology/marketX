<!-- TrustCardOverlay — taps the shield button on a feed slide's action bar and
     shows that seller's real MarketX Trust Card (verified identity, public MX
     ID, live QR, and the real trust facts from /api/reputation/profile).

     Data is fetched lazily, on first open, per store slug — NOT on mount. A
     feed screen holds ~15 mounted slides at once and useStoreCard().load()
     chains two API calls (seller → reputation profile), so eager loading
     would fire ~30 requests for cards nobody has asked to see. The result is
     cached in-component, so reopening the same seller's card is instant and
     doesn't refetch. -->
<template>
  <BaseModal
    v-model="open"
    title="Trust Card"
    no-padding
    max-width="sm"
    anchor="top"
  >
    <div class="p-4">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-16">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"
        />
      </div>

      <!-- Failed / no such store — say so plainly rather than showing an
           empty card that would read as "this seller has no trust record". -->
      <div
        v-else-if="!seller"
        class="flex flex-col items-center gap-2 py-12 text-center"
      >
        <Icon
          name="solar:shield-cross-linear"
          size="32"
          class="text-gray-300 dark:text-neutral-600"
        />
        <p class="text-sm text-gray-500 dark:text-neutral-400">
          Couldn't load this seller's Trust Card.
        </p>
      </div>

      <!-- The real card — same component the share/store-card surfaces use -->
      <MarketXCard
        v-else
        :seller="seller"
        :product-count="productCount"
        :qr="qr"
        :trust="trust"
        :share-url="shareUrl"
        :display-url="displayUrl"
        :copied="copied"
        @copy="copy"
      />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import MarketXCard from '~~/layers/seller/app/components/MarketXCard.vue'
import { useStoreCard } from '~~/layers/seller/app/composables/useStoreCard'

const props = defineProps<{
  modelValue: boolean
  /** Real store slug — never a username; see IFeedItem.author.storeSlug. */
  storeSlug?: string | null
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const open = ref(props.modelValue)
watch(
  () => props.modelValue,
  (v) => {
    open.value = v
  },
)
watch(open, (v) => emit('update:modelValue', v))

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
} = useStoreCard()

// Tracks which slug is already loaded so reopening the same card is free.
const loadedSlug = ref<string | null>(null)

watch(
  () => [open.value, props.storeSlug] as const,
  async ([isOpen, slug]) => {
    if (!isOpen || !slug || loadedSlug.value === slug) return
    loadedSlug.value = slug
    await load(slug)
  },
  { immediate: true },
)
</script>
