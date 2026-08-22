<template>
  <BaseModal
    :model-value="isOpen"
    title="Create"
    max-width="sm"
    no-padding
    @update:model-value="(v) => !v && $emit('close')"
  >
    <div class="p-2">
      <button class="create-option" @click="$emit('open-post-modal')">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand"
        >
          <Icon name="solar:gallery-add-linear" size="22" class="text-white" />
        </div>
        <div class="flex-1 text-left">
          <p class="t-subheading">Post</p>
          <p class="t-meta">Share photos and videos</p>
        </div>
      </button>

      <button class="create-option" @click="$emit('open-story-modal')">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 dark:bg-neutral-700"
        >
          <Icon name="solar:camera-add-linear" size="22" class="text-white" />
        </div>
        <div class="flex-1 text-left">
          <p class="t-subheading">Story</p>
          <p class="t-meta">Share a moment</p>
        </div>
      </button>

      <!-- Store owners only. Gated on owning a store rather than on
           profile.role: role is 'admin' for staff who also sell, and it lags
           behind by up to the 60 s profile:own cache right after a store is
           created — both of which hid this option from people who could use
           it. QuickProductModal needs a store to publish into anyway, so
           "has a store" is the condition that actually matters. -->
      <button
        v-if="sellerStore.hasSellers"
        class="create-option"
        @click="$emit('open-product-modal')"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-2xl bg-mint"
        >
          <Icon name="solar:bag-4-linear" size="22" class="text-white" />
        </div>
        <div class="flex-1 text-left">
          <p class="t-subheading">Product</p>
          <p class="t-meta">List an item for sale</p>
        </div>
      </button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { useSellerStore } from '~~/layers/seller/app/store/seller.store'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'

defineProps<{
  isOpen: boolean
}>()

defineEmits([
  'close',
  'open-post-modal',
  'open-story-modal',
  'open-product-modal',
])

const sellerStore = useSellerStore()
</script>

<style scoped>
.create-option {
  @apply flex w-full items-center gap-4 rounded-xl p-4 transition-colors duration-150 hover:bg-gray-50 dark:hover:bg-neutral-800;
}
</style>
