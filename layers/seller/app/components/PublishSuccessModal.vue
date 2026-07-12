<template>
  <BaseModal
    :model-value="open"
    max-width="md"
    hide-close
    persistent
    @update:model-value="(v) => !v && emit('close')"
  >
    <div class="text-center">
      <!-- Success crest -->
      <div
        class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30"
      >
        <Icon
          name="solar:check-circle-bold"
          size="34"
          class="text-emerald-500"
        />
      </div>
      <h2 class="text-lg font-bold text-gray-900 dark:text-neutral-100">
        {{ isDraft ? 'Draft saved' : 'Your product is live! 🎉' }}
      </h2>
      <p class="mx-auto mt-1 max-w-xs text-sm text-gray-500 dark:text-neutral-400">
        <template v-if="isDraft">
          “{{ product?.title }}” is saved. Publish it when you’re ready.
        </template>
        <template v-else>
          “{{ product?.title }}” is in your store. Now let’s get it in front of
          buyers.
        </template>
      </p>
    </div>

    <!-- Next-best-action list -->
    <div v-if="!isDraft" class="mt-5 space-y-2">
      <!-- Share to Feed -->
      <button
        type="button"
        :disabled="feedDone || feedBusy"
        class="flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors"
        :class="
          feedDone
            ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-900/20'
            : 'border-gray-200 hover:border-brand hover:bg-brand/5 dark:border-neutral-700 dark:hover:border-brand'
        "
        @click="shareToFeed"
      >
        <span
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10"
        >
          <Icon name="solar:gallery-wide-linear" size="18" class="text-brand" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-gray-900 dark:text-neutral-100">
            Share to Feed
          </span>
          <span class="block text-xs text-gray-500 dark:text-neutral-400">
            {{
              feedDone
                ? 'Posted to your social feed'
                : inFeed
                  ? 'Already in your feed'
                  : 'Post it as a shoppable feed card'
            }}
          </span>
        </span>
        <Icon
          v-if="feedBusy"
          name="eos-icons:loading"
          size="18"
          class="shrink-0 animate-spin text-brand"
        />
        <Icon
          v-else-if="feedDone || inFeed"
          name="solar:check-circle-bold"
          size="18"
          class="shrink-0 text-emerald-500"
        />
        <span
          v-else-if="!isPremium"
          class="shrink-0 rounded-full bg-violet px-2 py-0.5 text-[10px] font-bold text-white"
          >PREMIUM</span
        >
        <Icon v-else name="solar:alt-arrow-right-linear" size="18" class="shrink-0 text-gray-300" />
      </button>

      <!-- Create a Reel -->
      <NuxtLink
        :to="editUrl"
        class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:border-brand hover:bg-brand/5 dark:border-neutral-700 dark:hover:border-brand"
        @click="emit('close')"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
          <Icon name="solar:clapperboard-play-linear" size="18" class="text-brand" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-gray-900 dark:text-neutral-100">
            Feature as a Reel
          </span>
          <span class="block text-xs text-gray-500 dark:text-neutral-400">
            {{ hasVideo ? 'Turn your video into a shoppable Reel' : 'Add a video to feature it' }}
          </span>
        </span>
        <Icon name="solar:alt-arrow-right-linear" size="18" class="shrink-0 text-gray-300" />
      </NuxtLink>

      <!-- Enable affiliate -->
      <NuxtLink
        v-if="!hasAffiliate"
        :to="editUrl"
        class="flex items-center gap-3 rounded-xl border border-gray-200 p-3 transition-colors hover:border-brand hover:bg-brand/5 dark:border-neutral-700 dark:hover:border-brand"
        @click="emit('close')"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10">
          <Icon name="solar:money-bag-linear" size="18" class="text-brand" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-gray-900 dark:text-neutral-100">
            Enable affiliate rewards
          </span>
          <span class="block text-xs text-gray-500 dark:text-neutral-400">
            Let creators earn by promoting it
          </span>
        </span>
        <Icon name="solar:alt-arrow-right-linear" size="18" class="shrink-0 text-gray-300" />
      </NuxtLink>
      <div
        v-else
        class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/40 dark:bg-emerald-900/20"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
          <Icon name="solar:money-bag-linear" size="18" class="text-emerald-500" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-gray-900 dark:text-neutral-100">
            Affiliate rewards on
          </span>
          <span class="block text-xs text-gray-500 dark:text-neutral-400">
            Creators can now earn from this product
          </span>
        </span>
        <Icon name="solar:check-circle-bold" size="18" class="shrink-0 text-emerald-500" />
      </div>

      <!-- Followers notified — happens automatically on publish -->
      <div
        class="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800/40 dark:bg-emerald-900/20"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
          <Icon name="solar:speaker-linear" size="18" class="text-emerald-500" />
        </span>
        <span class="min-w-0 flex-1">
          <span class="block text-sm font-semibold text-gray-900 dark:text-neutral-100">
            Followers notified
          </span>
          <span class="block text-xs text-gray-500 dark:text-neutral-400">
            Everyone following your store just got an alert
          </span>
        </span>
        <Icon name="solar:check-circle-bold" size="18" class="shrink-0 text-emerald-500" />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <BaseButton variant="secondary" class="flex-1" @click="emit('add-another')">
          Add another
        </BaseButton>
        <BaseButton
          variant="primary"
          class="flex-1"
          @click="goToProduct"
        >
          {{ isDraft ? 'View drafts' : 'View product' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { notify } from '@kyvg/vue3-notification'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { useProductApi } from '~~/layers/commerce/app/services/product.api'

const props = defineProps<{
  open: boolean
  product: { id: number; title: string; slug?: string } | null
  storeSlug: string
  isDraft?: boolean
  isPremium?: boolean
  inFeed?: boolean
  hasAffiliate?: boolean
  hasVideo?: boolean
}>()

const emit = defineEmits<{
  close: []
  'add-another': []
}>()

const router = useRouter()
const productApi = useProductApi()

const editUrl = computed(
  () => `/seller/${props.storeSlug}/products/${props.product?.id}/edit`,
)

const goToProduct = () => {
  if (props.isDraft || !props.product?.slug) {
    router.push(`/seller/${props.storeSlug}/products`)
  } else {
    router.push(`/product/${props.product.slug}`)
  }
  emit('close')
}

// ── Share to Feed (one-click, premium only) ──────────────────────────────────
const feedBusy = ref(false)
const feedDone = ref(false)

const shareToFeed = async () => {
  if (feedDone.value || props.inFeed) return
  if (!props.isPremium) {
    notify({
      type: 'warn',
      text: 'Sharing to the feed is a Premium feature.',
    })
    return
  }
  if (!props.product?.id) return
  feedBusy.value = true
  try {
    await productApi.updateProduct(props.product.id, { showInFeed: true } as any)
    feedDone.value = true
    notify({ type: 'success', text: 'Shared to your feed ✨' })
  } catch {
    notify({ type: 'error', text: 'Could not share to feed — try again' })
  } finally {
    feedBusy.value = false
  }
}
</script>
