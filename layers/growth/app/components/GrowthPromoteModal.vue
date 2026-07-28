<template>
  <BaseModal
    :model-value="open"
    title="Promote"
    max-width="sm"
    @update:model-value="(v) => !v && emit('close')"
  >
    <div v-if="product" class="space-y-4">
      <ProductShareCard
        ref="cardRef"
        :product="product"
        :qr="qr"
        :share-url="trackedUrl"
        :display-url="trackedUrl"
        :price-text="priceText"
        :copied="null"
      />

      <!-- Organic share — free, works everywhere -->
      <div class="flex gap-2">
        <BaseButton variant="secondary" size="sm" :loading="capturing" @click="onDownload">
          <Icon name="solar:download-minimalistic-linear" size="16" />
          Download
        </BaseButton>
        <BaseButton variant="secondary" size="sm" :loading="capturing" @click="onShare">
          <Icon name="solar:share-linear" size="16" />
          Share
        </BaseButton>
      </div>

      <!-- TikTok -->
      <div class="rounded-xl border border-gray-100 p-3 dark:border-neutral-800">
        <div class="mb-2 flex items-center gap-2">
          <Icon name="ic:baseline-tiktok" size="18" />
          <span class="font-semibold text-gray-900 dark:text-neutral-100">Post to TikTok</span>
        </div>

        <!-- Not connected -->
        <div v-if="tiktokState === 'disconnected'" class="text-sm text-gray-500 dark:text-neutral-400">
          Connect your TikTok first.
          <NuxtLink :to="`/seller/${storeSlug}/connections`" class="font-semibold text-brand">
            Connect →
          </NuxtLink>
        </div>

        <!-- Connected -->
        <div v-else-if="tiktokState === 'ready'" class="space-y-2">
          <p v-if="creatorInfo?.nickname" class="text-xs text-gray-500 dark:text-neutral-400">
            Posting as <span class="font-semibold">{{ creatorInfo.nickname }}</span>
          </p>
          <textarea
            v-model="caption"
            rows="2"
            placeholder="Caption…"
            class="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-brand focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <BaseSelect v-model="privacyLevel" label="Who can see it" :options="privacyOptions" size="sm" />
          <BaseButton variant="primary" size="sm" :loading="posting || uploading" :disabled="!privacyLevel" @click="onPost">
            Post to TikTok
          </BaseButton>
          <p class="text-[11px] text-gray-400 dark:text-neutral-500">
            Until your app is approved, TikTok keeps posts private (only you see them).
          </p>
        </div>

        <!-- Loading creator info -->
        <div v-else class="text-sm text-gray-400">Checking TikTok…</div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { notify } from '@kyvg/vue3-notification'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseSelect from '~~/layers/ui/app/components/BaseSelect.vue'
import ProductShareCard from '~~/layers/commerce/app/components/product-card/ProductShareCard.vue'
import { useCardCapture } from '~~/layers/seller/app/composables/useCardCapture'
import { useGrowthAsset } from '~~/layers/growth/app/composables/useGrowthAsset'
import { formatProductPrice } from '~~/shared/utils/currency'

const props = defineProps<{ open: boolean; product: any }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const {
  qr,
  trackedUrl,
  uploading,
  posting,
  creatorInfo,
  prepare,
  loadTikTokCreatorInfo,
  postToTikTok,
} = useGrowthAsset()
const { capture, shareImage, capturing } = useCardCapture()

const cardRef = ref<{ rootEl: HTMLElement | null } | null>(null)
const tiktokState = ref<'loading' | 'ready' | 'disconnected'>('loading')
const caption = ref('')
const privacyLevel = ref('')

const storeSlug = computed(
  () => props.product?.seller?.store_slug || props.product?.store_slug || '',
)
const priceText = computed(() => {
  const p = props.product
  if (!p) return ''
  const disc = p.discount ?? 0
  return formatProductPrice(
    disc > 0 ? Math.round(p.price * (1 - disc / 100)) : p.price,
    'NGN',
  )
})

const PRIVACY_LABELS: Record<string, string> = {
  PUBLIC_TO_EVERYONE: 'Everyone',
  MUTUAL_FOLLOW_FRIENDS: 'Friends',
  FOLLOWER_OF_CREATOR: 'Followers',
  SELF_ONLY: 'Only me',
}
const privacyOptions = computed(() =>
  (creatorInfo.value?.privacyOptions ?? []).map((v) => ({
    value: v,
    label: PRIVACY_LABELS[v] ?? v,
  })),
)

const slug = () => props.product?.slug || 'product'
const onDownload = () => capture(cardRef.value?.rootEl, `${slug()}-card.png`)
const onShare = () =>
  shareImage(cardRef.value?.rootEl, {
    slug: slug(),
    text: `${props.product?.title}\n${trackedUrl.value}`,
    title: props.product?.title,
  })

async function onPost() {
  try {
    const res = await postToTikTok(cardRef.value?.rootEl, {
      caption: caption.value,
      privacyLevel: privacyLevel.value,
    })
    if (res) notify({ type: 'success', text: 'Sent to TikTok — processing' })
  } catch (e) {
    notify({ type: 'error', text: (e as Error)?.message || 'TikTok post failed' })
  }
}

watch(
  () => [props.open, props.product] as const,
  async ([open, p]) => {
    if (!open || !p) return
    tiktokState.value = 'loading'
    caption.value = p.title ?? ''
    try {
      await prepare(p.id)
    } catch (e) {
      // Asset creation failed — don't hang the modal on "Checking TikTok".
      tiktokState.value = 'disconnected'
      notify({ type: 'error', text: (e as Error)?.message || 'Could not prepare the card' })
      return
    }
    try {
      const info = await loadTikTokCreatorInfo()
      privacyLevel.value = info.privacyOptions?.[0] ?? 'SELF_ONLY'
      tiktokState.value = 'ready'
    } catch {
      tiktokState.value = 'disconnected'
    }
  },
  { immediate: true },
)
</script>
