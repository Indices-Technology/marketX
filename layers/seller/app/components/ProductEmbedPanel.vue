<template>
  <div
    class="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-neutral-700 dark:bg-neutral-800"
  >
    <div class="mb-3 flex items-center gap-2">
      <Icon name="solar:code-square-linear" size="20" class="text-brand" />
      <div>
        <h2 class="font-semibold text-gray-900 dark:text-neutral-100">
          Embed on your website
        </h2>
        <p class="text-xs text-gray-500 dark:text-neutral-400">
          Paste this on your own blog or site — it shows a live product card
          with price and a link back to checkout. Views and clicks are tracked
          here.
        </p>
      </div>
    </div>

    <BaseButton
      v-if="!snippet"
      variant="secondary"
      size="sm"
      :loading="loading"
      @click="getSnippet"
    >
      <Icon name="solar:code-square-linear" size="16" class="mr-1.5" />
      Get embed code
    </BaseButton>

    <div v-else class="space-y-2">
      <textarea
        :value="snippet"
        readonly
        rows="3"
        class="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 font-mono text-xs text-gray-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300"
        @focus="($event.target as HTMLTextAreaElement).select()"
      />
      <BaseButton variant="secondary" size="sm" @click="copySnippet">
        <Icon
          :name="copied ? 'solar:check-circle-linear' : 'solar:copy-linear'"
          size="15"
          class="mr-1.5"
        />
        {{ copied ? 'Copied!' : 'Copy code' }}
      </BaseButton>
      <p class="text-[11px] text-gray-400 dark:text-neutral-500">
        If your video isn't playing on the embedded card, add
        <code>allow="autoplay"</code> to the iframe tag.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { notify } from '@kyvg/vue3-notification'
import { useRuntimeConfig } from '#imports'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { useGrowthAssetApi } from '~~/layers/growth/app/services/growthAsset.api'

const props = defineProps<{ productId: number }>()

const config = useRuntimeConfig()
const growthAssetApi = useGrowthAssetApi()
const loading = ref(false)
const snippet = ref('')
const copied = ref(false)

const getSnippet = async () => {
  loading.value = true
  try {
    const res = await growthAssetApi.forEmbed(props.productId)
    const base = (config.public.baseURL as string).replace(/\/+$/, '')
    const src = `${base}/embed/product/${res.data.slug}?code=${res.data.shortCode}`
    snippet.value = `<iframe src="${src}" width="320" height="480" style="border:0" loading="lazy" allow="autoplay"></iframe>`
  } catch {
    notify({ type: 'error', text: 'Could not create the embed code' })
  } finally {
    loading.value = false
  }
}

const copySnippet = async () => {
  try {
    await navigator.clipboard.writeText(snippet.value)
    copied.value = true
    notify({ type: 'success', text: 'Embed code copied!' })
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    notify({ type: 'error', text: 'Could not copy' })
  }
}
</script>
