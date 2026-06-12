<template>
  <BaseCard variant="default">
    <div class="flex items-start gap-3">
      <!-- Buyer avatar / anonymous -->
      <BaseAvatar
        :src="request.buyer?.avatar"
        :name="request.buyer?.username || 'Buyer'"
        size="sm"
      />
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-[13px] font-semibold text-gray-900 dark:text-neutral-100">
            {{ request.buyer?.username ? `@${request.buyer.username}` : 'A buyer' }}
          </span>
          <span class="text-[11px] text-gray-400">looking for</span>
          <BaseBadge
            v-if="request.status !== 'OPEN'"
            :status="request.status === 'FULFILLED' ? 'success' : 'muted'"
            :label="request.status === 'FULFILLED' ? 'Fulfilled' : request.status.toLowerCase()"
            size="xs"
          />
        </div>

        <h3 class="mt-0.5 font-display text-base font-bold text-gray-900 dark:text-neutral-100">
          {{ request.title }}
        </h3>

        <!-- Meta chips -->
        <div class="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
          <span v-if="budgetLabel" class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
            {{ budgetLabel }}
          </span>
          <span v-if="request.condition" class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
            {{ conditionLabel }}
          </span>
          <span v-if="request.sizeSpec" class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
            {{ request.sizeSpec }}
          </span>
          <span v-if="request.deliverTo" class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600 dark:bg-neutral-800 dark:text-neutral-300">
            <Icon name="mdi:map-marker-outline" size="11" /> {{ request.deliverTo }}
          </span>
        </div>

        <p v-if="request.note" class="mt-1.5 text-[13px] leading-relaxed text-gray-600 dark:text-neutral-400">
          {{ request.note }}
        </p>

        <!-- Actions -->
        <div class="mt-3 flex items-center gap-2">
          <!-- Seller: respond -->
          <BaseButton
            v-if="canRespond && request.status === 'OPEN'"
            size="sm"
            variant="primary"
            @click="$emit('respond', request)"
          >
            <Icon name="mdi:tag-plus-outline" size="15" /> Respond with product
          </BaseButton>

          <!-- Owner: view offers / close -->
          <BaseButton
            v-if="isOwner && offerCount > 0"
            size="sm"
            variant="secondary"
            :loading="loadingOffers"
            @click="toggleOffers"
          >
            {{ expanded ? 'Hide' : `View ${offerCount} offer${offerCount === 1 ? '' : 's'}` }}
          </BaseButton>
          <span v-else-if="offerCount > 0" class="text-[12px] text-gray-400">
            {{ offerCount }} offer{{ offerCount === 1 ? '' : 's' }}
          </span>
          <BaseButton
            v-if="isOwner && request.status === 'OPEN'"
            size="sm"
            variant="ghost"
            @click="$emit('close-request', request)"
          >
            Close
          </BaseButton>
        </div>

        <!-- Offers (owner, expanded) -->
        <div v-if="expanded" class="mt-3 space-y-2">
          <SquareOfferItem
            v-for="offer in offers"
            :key="offer.id"
            :offer="offer"
            :can-act="isOwner && request.status === 'OPEN'"
            :acting="actingOfferId === offer.id ? actingAction : null"
            @accept="onAccept"
            @decline="onDecline"
          />
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseCard from '~~/layers/ui/app/components/BaseCard.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import BaseAvatar from '~~/layers/ui/app/components/BaseAvatar.vue'
import SquareOfferItem from './SquareOfferItem.vue'
import { useSquareApi } from '~~/layers/square/app/services/square.api'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'

const props = defineProps<{
  request: any
  slug: string
  isOwner?: boolean
  canRespond?: boolean
}>()
const emit = defineEmits<{
  respond: [request: any]
  'close-request': [request: any]
  accepted: [payload: any]
}>()

const squareApi = useSquareApi()
const { formatPrice } = useCurrency()

const offerCount = computed(() => props.request._count?.offers ?? props.request.offers?.length ?? 0)

const CONDITION_LABELS: Record<string, string> = {
  NEW_WITH_TAGS: 'New w/ tags',
  LIKE_NEW: 'Like new',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
}
const conditionLabel = computed(() => CONDITION_LABELS[props.request.condition] ?? props.request.condition)

const budgetLabel = computed(() => {
  const min = props.request.budgetMin
  const max = props.request.budgetMax
  if (min != null && max != null) return `${formatPrice(min)} – ${formatPrice(max)}`
  if (max != null) return `Up to ${formatPrice(max)}`
  if (min != null) return `From ${formatPrice(min)}`
  return ''
})

// ── Offers (lazy-loaded on expand for the owner) ──────────────────────────────
const expanded = ref(false)
const offers = ref<any[]>([])
const loadingOffers = ref(false)
const actingOfferId = ref<string | null>(null)
const actingAction = ref<'ACCEPT' | 'DECLINE' | null>(null)

const toggleOffers = async () => {
  if (expanded.value) { expanded.value = false; return }
  loadingOffers.value = true
  try {
    const res = await squareApi.getRequest(props.slug, props.request.id)
    offers.value = res.data?.offers ?? []
    expanded.value = true
  } finally {
    loadingOffers.value = false
  }
}

const onAccept = async (offer: any) => {
  actingOfferId.value = offer.id
  actingAction.value = 'ACCEPT'
  try {
    const res = await squareApi.actOnOffer(props.slug, props.request.id, offer.id, 'ACCEPT')
    offer.status = 'ACCEPTED'
    props.request.status = 'FULFILLED'
    emit('accepted', res.data) // { productId, variantId } → parent routes to cart/checkout
  } finally {
    actingOfferId.value = null
    actingAction.value = null
  }
}

const onDecline = async (offer: any) => {
  actingOfferId.value = offer.id
  actingAction.value = 'DECLINE'
  try {
    await squareApi.actOnOffer(props.slug, props.request.id, offer.id, 'DECLINE')
    offer.status = 'DECLINED'
  } finally {
    actingOfferId.value = null
    actingAction.value = null
  }
}
</script>
