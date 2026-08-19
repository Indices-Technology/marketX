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
        :copied="copied"
        @copy="onCopy"
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

        <Transition name="fade" mode="out-in">
        <!-- Not connected -->
        <div v-if="tiktokState === 'disconnected'" key="disconnected" class="space-y-2">
          <p class="text-sm text-gray-500 dark:text-neutral-400">
            Connect your TikTok to post this card directly.
          </p>
          <BaseButton variant="primary" size="sm" :loading="connecting" @click="onConnectTikTok">
            Connect TikTok
          </BaseButton>
        </div>

        <!-- Connected -->
        <div v-else-if="tiktokState === 'ready'" key="ready" class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <div v-if="creatorInfo?.nickname" class="flex items-center gap-2">
              <BaseAvatar :src="creatorInfo.avatarUrl" :name="creatorInfo.nickname" size="xs" />
              <p class="text-xs text-gray-500 dark:text-neutral-400">
                Posting as <span class="font-semibold">{{ creatorInfo.nickname }}</span>
              </p>
            </div>
            <button
              type="button"
              class="text-[11px] font-medium text-gray-400 hover:text-red-500 disabled:opacity-50 dark:text-neutral-500"
              :disabled="disconnecting"
              @click="onDisconnectTikTok"
            >
              Disconnect
            </button>
          </div>

          <BaseInput v-model="title" label="Title" placeholder="Product name" size="sm" />

          <textarea
            v-model="caption"
            rows="2"
            placeholder="Caption…"
            class="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-brand focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          <!-- creator_info returned no privacy options — this TikTok account cannot
               receive a Direct Post right now (TikTok's own eligibility signal).
               Stop here rather than show a form with nothing to submit. -->
          <p
            v-if="!canDirectPost"
            class="rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
          >
            Your TikTok account can't receive a Direct Post right now. You can still send this to
            your TikTok inbox as a draft below.
          </p>

          <template v-else>
            <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
              <input
                v-model="allowComment"
                type="checkbox"
                :disabled="creatorInfo?.commentDisabled"
                class="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand dark:border-neutral-600"
              />
              Allow comments
            </label>

            <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
              <input
                v-model="isPromotional"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand dark:border-neutral-600"
              />
              This is promotional content
            </label>

            <Transition name="fade">
            <div v-if="isPromotional" class="ml-1 space-y-1.5 border-l-2 border-gray-100 pl-3 dark:border-neutral-800">
              <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
                <input
                  v-model="brandOrganic"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand dark:border-neutral-600"
                />
                Your Brand
              </label>
              <label class="flex cursor-pointer items-center gap-2 text-sm text-gray-700 dark:text-neutral-300">
                <input
                  v-model="brandContent"
                  type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand dark:border-neutral-600"
                />
                Branded Content
              </label>
              <p v-if="!brandOrganic && !brandContent" class="text-[11px] text-red-500">
                Select at least one option
              </p>
              <p v-else class="text-[11px] text-gray-400 dark:text-neutral-500">
                Your photo will be labeled as "{{ brandContent ? 'Paid partnership' : 'Promotional content' }}"
              </p>
            </div>
            </Transition>

            <!-- Photo posts only — TikTok's Duet/Stitch interaction settings are
                 video-only and don't apply to this integration (see
                 content-posting-api-reference-photo-post). Comment is the only
                 applicable interaction toggle. -->
            <BaseSelect
              v-model="privacyLevel"
              label="Who can see it"
              placeholder="Choose who can see it"
              :options="privacyOptions"
              size="sm"
            />
            <p v-if="brandContent && privacyLevel === 'SELF_ONLY'" class="text-[11px] text-red-500">
              Branded content can't be set to private — choose a public or friends option
            </p>

            <p class="text-[11px] text-gray-400 dark:text-neutral-500">
              By posting, you agree to TikTok's
              <span v-if="brandContent"> Branded Content Policy and</span>
              Music Usage Confirmation.
            </p>

            <BaseButton variant="primary" size="sm" :loading="posting || uploading" :disabled="!canPost" @click="onPost">
              Post to TikTok
            </BaseButton>

            <p class="text-[11px] text-gray-400 dark:text-neutral-500">
              Until your app is approved, TikTok keeps posts private (only you see them). Processing can take a few
              minutes after you post.
            </p>
          </template>

          <div class="border-t border-gray-100 pt-2 dark:border-neutral-800">
            <BaseButton variant="secondary" size="sm" :loading="posting || uploading" @click="onSendDraft">
              Send to TikTok inbox instead
            </BaseButton>
            <p class="mt-1 text-[11px] text-gray-400 dark:text-neutral-500">
              Lands as a draft in your TikTok app — finish editing and post it yourself there (this
              is also how you can attach a clickable link). Not restricted while your app is in review.
            </p>
          </div>

          <Transition name="fade">
            <p v-if="statusText" class="text-xs" :class="statusClass">{{ statusText }}</p>
          </Transition>
        </div>

        <!-- Loading creator info -->
        <div v-else key="loading" class="space-y-2">
          <BaseSkeleton shape="line" width="60%" height="14px" />
          <BaseSkeleton shape="block" height="36px" rounded="rounded-lg" />
          <BaseSkeleton shape="block" height="52px" rounded="rounded-lg" />
        </div>
        </Transition>
      </div>

      <!-- Facebook -->
      <div class="rounded-xl border border-gray-100 p-3 dark:border-neutral-800">
        <div class="mb-2 flex items-center gap-2">
          <Icon name="logos:facebook" size="18" />
          <span class="font-semibold text-gray-900 dark:text-neutral-100">Post to Facebook</span>
        </div>

        <Transition name="fade" mode="out-in">
        <!-- Not connected -->
        <div v-if="facebookState === 'disconnected'" key="disconnected" class="space-y-2">
          <p class="text-sm text-gray-500 dark:text-neutral-400">
            Connect your Facebook Page to post this card directly.
          </p>
          <BaseButton variant="primary" size="sm" :loading="connecting" @click="onConnectFacebook">
            Connect Facebook
          </BaseButton>
        </div>

        <!-- Connected -->
        <div v-else-if="facebookState === 'ready'" key="ready" class="space-y-2">
          <div class="flex items-center justify-between gap-2">
            <p v-if="facebookConn?.displayName" class="text-xs text-gray-500 dark:text-neutral-400">
              Posting to <span class="font-semibold">{{ facebookConn.displayName }}</span>
            </p>
            <button
              type="button"
              class="text-[11px] font-medium text-gray-400 hover:text-red-500 disabled:opacity-50 dark:text-neutral-500"
              :disabled="disconnectingFacebook"
              @click="onDisconnectFacebook"
            >
              Disconnect
            </button>
          </div>

          <textarea
            v-model="facebookCaption"
            rows="2"
            placeholder="Caption…"
            class="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-brand focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />

          <BaseButton variant="primary" size="sm" :loading="facebookPosting || uploading" @click="onPostFacebook">
            Post to Facebook
          </BaseButton>

          <p v-if="facebookPostResult" class="text-xs text-green-600 dark:text-green-400">
            Posted to your Facebook Page.
          </p>
        </div>

        <!-- Loading connection state -->
        <div v-else key="loading" class="space-y-2">
          <BaseSkeleton shape="line" width="70%" height="14px" />
          <BaseSkeleton shape="block" height="36px" rounded="rounded-lg" />
        </div>
        </Transition>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { notify } from '@kyvg/vue3-notification'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseSelect from '~~/layers/ui/app/components/BaseSelect.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseAvatar from '~~/layers/ui/app/components/BaseAvatar.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import ProductShareCard from '~~/layers/commerce/app/components/product-card/ProductShareCard.vue'
import { useCardCapture } from '~~/layers/seller/app/composables/useCardCapture'
import { useGrowthAsset } from '~~/layers/growth/app/composables/useGrowthAsset'
import { useConnections } from '~~/layers/growth/app/composables/useConnections'
import { formatProductPrice } from '~~/shared/utils/currency'

const props = defineProps<{ open: boolean; product: any }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const route = useRoute()
const {
  qr,
  trackedUrl,
  uploading,
  posting,
  facebookPosting,
  creatorInfo,
  tiktokPostStatus,
  tiktokFailReason,
  prepare,
  loadTikTokCreatorInfo,
  postToTikTok,
  postToTikTokDraft,
  postToFacebook,
} = useGrowthAsset()
const { capture, shareImage, capturing } = useCardCapture()
const {
  connectTikTok,
  connectFacebook,
  connecting,
  refresh: refreshConnections,
  forPlatform,
  disconnect,
} = useConnections()

/**
 * Connect without leaving the product the seller was promoting — round-trips
 * through TikTok OAuth back to this exact page with `?promote=<id>` so the
 * caller reopens this same modal for this same product on return, instead of
 * dumping the seller on the Connected Accounts page to navigate back manually.
 */
function onConnectTikTok() {
  if (!props.product) return
  connectTikTok(`${route.path}?promote=${props.product.id}`)
}

const disconnecting = ref(false)
async function onDisconnectTikTok() {
  const conn = forPlatform('TIKTOK')
  if (!conn) return
  disconnecting.value = true
  try {
    await disconnect(conn.id)
    creatorInfo.value = null
    tiktokState.value = 'disconnected'
    notify({ type: 'success', text: 'TikTok disconnected' })
  } finally {
    disconnecting.value = false
  }
}

const cardRef = ref<{ rootEl: HTMLElement | null } | null>(null)
const tiktokState = ref<'loading' | 'ready' | 'disconnected'>('loading')
const caption = ref('')
const title = ref('')
const privacyLevel = ref('')
const allowComment = ref(false)
const isPromotional = ref(false)
const brandOrganic = ref(false)
const brandContent = ref(false)
const copied = ref<string | null>(null)

const facebookState = ref<'loading' | 'ready' | 'disconnected'>('loading')
const facebookCaption = ref('')
const facebookPostResult = ref<{ postId: string } | null>(null)
const disconnectingFacebook = ref(false)
const facebookConn = computed(() => forPlatform('META_FB'))

function onConnectFacebook() {
  if (!props.product) return
  connectFacebook(`${route.path}?promote=${props.product.id}`)
}

async function onDisconnectFacebook() {
  const conn = forPlatform('META_FB')
  if (!conn) return
  disconnectingFacebook.value = true
  try {
    await disconnect(conn.id)
    facebookState.value = 'disconnected'
    notify({ type: 'success', text: 'Facebook disconnected' })
  } finally {
    disconnectingFacebook.value = false
  }
}

async function onPostFacebook() {
  try {
    const res = await postToFacebook(cardRef.value?.rootEl, { caption: facebookCaption.value })
    if (res) {
      facebookPostResult.value = res
      notify({ type: 'success', text: 'Posted to Facebook' })
    }
  } catch (e) {
    notify({ type: 'error', text: (e as Error)?.message || 'Facebook post failed' })
  }
}

async function onCopy(text: string | null | undefined, label: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copied.value = label
    notify({ type: 'success', text: `${label} copied!` })
    setTimeout(() => (copied.value = null), 2000)
  } catch {
    notify({ type: 'error', text: 'Could not copy' })
  }
}

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
  (creatorInfo.value?.privacyOptions ?? [])
    // Branded Content can't be posted private — TikTok's guidelines require this
    // option be unavailable rather than silently rejected on submit.
    .filter((v) => !(brandContent.value && v === 'SELF_ONLY'))
    .map((v) => ({ value: v, label: PRIVACY_LABELS[v] ?? v })),
)

watch(brandContent, (checked) => {
  if (checked && privacyLevel.value === 'SELF_ONLY') privacyLevel.value = ''
})

// The "Your Brand"/"Branded Content" checkboxes are hidden (not unmounted-and-
// reset) when the promotional toggle goes off — without this, a previously
// checked brandContent stays true in the background, permanently filtering
// "Only me" out of the privacy dropdown with no visible control left to undo it.
watch(isPromotional, (on) => {
  if (!on) {
    brandOrganic.value = false
    brandContent.value = false
  }
})

// creator_info returning no privacy options is TikTok's own signal that this
// account can't receive a Direct Post right now — stop rather than render a
// form with nothing selectable.
const canDirectPost = computed(() => (creatorInfo.value?.privacyOptions?.length ?? 0) > 0)

const canPost = computed(() => {
  if (!canDirectPost.value) return false
  if (!privacyLevel.value) return false
  if (isPromotional.value && !brandOrganic.value && !brandContent.value) return false
  if (brandContent.value && privacyLevel.value === 'SELF_ONLY') return false
  return true
})

const statusText = computed(() => {
  switch (tiktokPostStatus.value) {
    case 'PROCESSING_DOWNLOAD':
    case 'PROCESSING_UPLOAD':
    case 'SEND_TO_USER_INBOX':
      return 'Processing on TikTok — this can take a few minutes…'
    case 'PUBLISH_COMPLETE':
      return 'Posted to TikTok.'
    case 'FAILED':
      return tiktokFailReason.value
        ? `TikTok couldn't process this post: ${tiktokFailReason.value}`
        : "TikTok couldn't process this post."
    default:
      return ''
  }
})
const statusClass = computed(() =>
  tiktokPostStatus.value === 'FAILED'
    ? 'text-red-500'
    : tiktokPostStatus.value === 'PUBLISH_COMPLETE'
      ? 'text-green-600 dark:text-green-400'
      : 'text-gray-400 dark:text-neutral-500',
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
  if (!canPost.value) return
  try {
    const res = await postToTikTok(cardRef.value?.rootEl, {
      privacyLevel: privacyLevel.value,
      caption: caption.value,
      title: title.value,
      allowComment: allowComment.value && !creatorInfo.value?.commentDisabled,
      isPromotional: isPromotional.value,
      brandOrganic: brandOrganic.value,
      brandContent: brandContent.value,
    })
    if (res) notify({ type: 'success', text: 'Sent to TikTok — processing' })
  } catch (e) {
    notify({ type: 'error', text: (e as Error)?.message || 'TikTok post failed' })
  }
}

async function onSendDraft() {
  try {
    const res = await postToTikTokDraft(cardRef.value?.rootEl, {
      caption: caption.value,
      title: title.value,
    })
    if (res) notify({ type: 'success', text: 'Sent to your TikTok inbox' })
  } catch (e) {
    notify({ type: 'error', text: (e as Error)?.message || 'Could not send to TikTok' })
  }
}

watch(
  () => [props.open, props.product] as const,
  async ([open, p]) => {
    if (!open || !p) return
    tiktokState.value = 'loading'
    caption.value = p.title ?? ''
    title.value = p.title ?? ''
    // No defaults for privacy/interaction settings — TikTok's Content Sharing
    // Guidelines require the seller to actively choose these, every time.
    privacyLevel.value = ''
    allowComment.value = false
    isPromotional.value = false
    brandOrganic.value = false
    brandContent.value = false
    facebookState.value = 'loading'
    facebookCaption.value = p.title ?? ''
    facebookPostResult.value = null
    try {
      await prepare(p.id)
    } catch (e) {
      // Asset creation failed — don't hang the modal on "Checking TikTok"/"Checking Facebook".
      tiktokState.value = 'disconnected'
      facebookState.value = 'disconnected'
      notify({ type: 'error', text: (e as Error)?.message || 'Could not prepare the card' })
      return
    }
    try {
      await refreshConnections()
    } catch {
      tiktokState.value = 'disconnected'
      facebookState.value = 'disconnected'
      return
    }
    // TikTok requires creator-info before it can post (its privacy options come
    // from there); Facebook doesn't — a connection alone is enough — so the two
    // checks run independently and a TikTok failure can't strand Facebook's state.
    try {
      await loadTikTokCreatorInfo()
      tiktokState.value = 'ready'
    } catch {
      tiktokState.value = 'disconnected'
    }
    facebookState.value = forPlatform('META_FB') ? 'ready' : 'disconnected'
  },
  { immediate: true },
)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
