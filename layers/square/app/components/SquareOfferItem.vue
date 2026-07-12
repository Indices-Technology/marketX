<template>
  <div
    class="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <NuxtLink :to="`/product/${offer.product?.slug || offer.product?.id}`" class="shrink-0">
      <img
        v-if="thumb"
        :src="thumb"
        :alt="offer.product?.title || 'Product'"
        class="h-14 w-14 rounded-lg object-cover"
        loading="lazy"
      />
      <div v-else class="flex h-14 w-14 items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800">
        <Icon name="solar:bag-4-linear" size="20" class="text-gray-400" />
      </div>
    </NuxtLink>

    <div class="min-w-0 flex-1">
      <NuxtLink
        :to="`/product/${offer.product?.slug || offer.product?.id}`"
        class="line-clamp-1 text-[13px] font-semibold text-gray-900 hover:text-brand dark:text-neutral-100"
      >
        {{ offer.product?.title }}
      </NuxtLink>
      <p class="font-display text-sm font-bold text-brand">
        {{ formatPrice(offer.product?.price || 0) }}
      </p>
      <NuxtLink
        :to="`/sellers/profile/${offer.seller?.store_slug}`"
        class="line-clamp-1 text-[11px] text-gray-500 hover:underline dark:text-neutral-400"
      >
        {{ offer.seller?.store_name || 'Seller' }}
      </NuxtLink>
      <p v-if="offer.message" class="mt-0.5 line-clamp-1 text-[11px] italic text-gray-400">
        "{{ offer.message }}"
      </p>
    </div>

    <div v-if="canAct && offer.status === 'PENDING'" class="flex shrink-0 flex-col gap-1.5">
      <BaseButton size="xs" variant="primary" :loading="acting === 'ACCEPT'" @click="$emit('accept', offer)">
        Accept
      </BaseButton>
      <BaseButton size="xs" variant="ghost" :loading="acting === 'DECLINE'" @click="$emit('decline', offer)">
        Decline
      </BaseButton>
    </div>
    <BaseBadge
      v-else-if="offer.status !== 'PENDING'"
      :status="offer.status === 'ACCEPTED' ? 'success' : 'muted'"
      :label="offer.status === 'ACCEPTED' ? 'Accepted' : 'Declined'"
      size="xs"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import { imgThumb } from '~~/layers/core/app/utils/cloudinary'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'

const props = defineProps<{
  offer: any
  canAct?: boolean
  acting?: 'ACCEPT' | 'DECLINE' | null
}>()
defineEmits<{ accept: [offer: any]; decline: [offer: any] }>()

const { formatPrice } = useCurrency()
const thumb = computed(() => {
  const url = props.offer.product?.media?.[0]?.url
  return url ? imgThumb(url) : ''
})
</script>
