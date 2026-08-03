<template>
  <BaseModal
    :model-value="open"
    title="Share this product"
    max-width="sm"
    @update:model-value="(v) => !v && emit('close')"
  >
    <div class="space-y-2">
      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        @click="emit('copy-link')"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800"
        >
          <Icon
            :name="
              copied ? 'solar:check-circle-linear' : 'solar:link-round-linear'
            "
            size="18"
            class="text-gray-700 dark:text-neutral-200"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-gray-900 dark:text-neutral-100">
            {{ copied ? 'Copied!' : 'Copy link' }}
          </p>
          <p class="text-xs text-gray-400 dark:text-neutral-500">
            Copy the direct product link
          </p>
        </div>
      </button>

      <button
        type="button"
        class="flex w-full items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
        @click="emit('open-card')"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800"
        >
          <Icon
            name="solar:card-2-linear"
            size="18"
            class="text-gray-700 dark:text-neutral-200"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-gray-900 dark:text-neutral-100">
            Share as card
          </p>
          <p class="text-xs text-gray-400 dark:text-neutral-500">
            A shareable card with QR — post it or send it
          </p>
        </div>
      </button>

      <!-- Owner-only — silently probed on open, so non-owners never see a
           button that would just 404 for them (embed links are seller-owned,
           like the CARD QR). -->
      <div v-if="embedSnippet">
        <div
          class="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3 dark:border-neutral-700"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-neutral-800"
          >
            <Icon
              name="solar:code-square-linear"
              size="18"
              class="text-gray-700 dark:text-neutral-200"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p
              class="text-sm font-semibold text-gray-900 dark:text-neutral-100"
            >
              Embed on your website
            </p>
            <p class="text-xs text-gray-400 dark:text-neutral-500">
              Paste this on your own blog or site
            </p>
          </div>
        </div>
        <textarea
          :value="embedSnippet"
          readonly
          rows="2"
          class="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-[11px] text-gray-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
          @focus="($event.target as HTMLTextAreaElement).select()"
        />
        <BaseButton
          variant="secondary"
          size="sm"
          class="mt-2 w-full"
          @click="copyEmbedSnippet"
        >
          <Icon
            :name="
              embedCopied ? 'solar:check-circle-linear' : 'solar:copy-linear'
            "
            size="15"
            class="mr-1.5"
          />
          {{ embedCopied ? 'Copied!' : 'Copy embed code' }}
        </BaseButton>
      </div>
      <div
        v-else-if="probingEmbed"
        class="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800"
      />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { notify } from '@kyvg/vue3-notification'
import { useRuntimeConfig } from '#imports'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { useGrowthAssetApi } from '~~/layers/growth/app/services/growthAsset.api'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'

const props = defineProps<{
  open: boolean
  productId: number
  copied?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'copy-link'): void
  (e: 'open-card'): void
}>()

const config = useRuntimeConfig()
const growthAssetApi = useGrowthAssetApi()
const profileStore = useProfileStore()

const probingEmbed = ref(false)
const embedSnippet = ref('')
const embedCopied = ref(false)

// Silent, best-effort: 404 (not the owner) just leaves embedSnippet empty — the
// section stays hidden, no error shown. Guests are skipped entirely (not just
// caught) — a 401 here would otherwise trip BaseApiClient's global "session
// expired" handler and bounce the viewer to /user-login, see
// [[feedback_auth_endpoint_guest_guard]].
const probeEmbed = async () => {
  if (!profileStore.isLoggedIn) return
  if (embedSnippet.value || probingEmbed.value) return
  probingEmbed.value = true
  try {
    const res = await growthAssetApi.forEmbed(props.productId)
    const base = (config.public.baseURL as string).replace(/\/+$/, '')
    const src = `${base}/embed/product/${res.data.slug}?code=${res.data.shortCode}`
    embedSnippet.value = `<iframe src="${src}" width="320" height="480" style="border:0" loading="lazy" allow="autoplay"></iframe>`
  } catch {
    /* not the owner, or not signed in — expected for most viewers */
  } finally {
    probingEmbed.value = false
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) probeEmbed()
  },
)

const copyEmbedSnippet = async () => {
  try {
    await navigator.clipboard.writeText(embedSnippet.value)
    embedCopied.value = true
    notify({ type: 'success', text: 'Embed code copied!' })
    setTimeout(() => (embedCopied.value = false), 2000)
  } catch {
    notify({ type: 'error', text: 'Could not copy' })
  }
}
</script>
