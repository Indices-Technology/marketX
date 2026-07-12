<template>
  <div
    class="space-y-4 rounded-xl border border-gray-200 bg-white p-4 sm:p-6 dark:border-neutral-700 dark:bg-neutral-800"
  >
    <h2 class="font-semibold text-gray-900 dark:text-neutral-100">
      Basic Information
    </h2>

    <div>
      <BaseInput
        v-model="form.title"
        label="Product Title *"
        placeholder="e.g. Vintage Denim Jacket"
        required
      />
    </div>

    <div>
      <div class="mb-1 flex items-center justify-between gap-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-neutral-300">
          Description *
        </label>
        <button
          type="button"
          :disabled="aiBusy || !canEnhance"
          :title="canEnhance ? 'Let AI polish your description' : 'Add a title or a few words first'"
          class="flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand/20 disabled:cursor-not-allowed disabled:opacity-50"
          @click="improveDescription"
        >
          <Icon
            :name="aiBusy ? 'eos-icons:loading' : 'solar:magic-stick-3-linear'"
            :class="{ 'animate-spin': aiBusy }"
            size="14"
          />
          {{ aiBusy ? 'Improving…' : form.description ? 'Improve with AI' : 'Write with AI' }}
        </button>
      </div>
      <ClientOnly>
        <HtmlDescriptionEditor
          v-model="form.description"
          placeholder="Describe your product…"
        />
        <template #fallback>
          <textarea
            v-model="form.description"
            rows="4"
            class="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </template>
      </ClientOnly>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label
          class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300"
        >
          Price (₦) *
        </label>
        <input
          v-model.number="form.price"
          type="number"
          required
          min="0"
          step="0.01"
          placeholder="0.00"
          class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
      <div>
        <label
          class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300"
        >
          Discount (%)
        </label>
        <input
          v-model.number="form.discount"
          type="number"
          min="0"
          max="100"
          placeholder="0"
          class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
      </div>
    </div>

    <!-- Affiliate Commission -->
    <div
      class="rounded-lg border border-brand/20 bg-brand/5 p-4 dark:border-brand/30 dark:bg-brand/10"
    >
      <div class="mb-1 flex items-center justify-between gap-2">
        <label class="block text-sm font-medium text-gray-700 dark:text-neutral-300">
          Affiliate Commission
          <span class="ml-0.5 text-xs font-normal text-gray-400 dark:text-neutral-500">
            (₦, optional)
          </span>
        </label>
        <button
          type="button"
          class="flex items-center gap-1 text-xs font-medium text-brand hover:underline"
          @click="showAffiliateHelp = !showAffiliateHelp"
        >
          <Icon name="solar:question-circle-linear" size="14" />
          How it works
        </button>
      </div>
      <p class="mb-2 text-xs text-gray-500 dark:text-neutral-400">
        Reward creators who promote this product. You’re
        <span class="font-semibold text-gray-700 dark:text-neutral-300">only charged after a successful sale</span>
        — never upfront.
      </p>
      <Transition
        enter-active-class="transition-all duration-200"
        enter-from-class="opacity-0 -translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
      >
        <div
          v-if="showAffiliateHelp"
          class="mb-3 space-y-1.5 rounded-lg bg-white/60 p-3 text-xs text-gray-600 dark:bg-neutral-900/50 dark:text-neutral-400"
        >
          <p class="flex items-start gap-2">
            <Icon name="solar:round-arrow-right-linear" size="15" class="mt-px shrink-0 text-brand" />
            A creator shares your product with their audience.
          </p>
          <p class="flex items-start gap-2">
            <Icon name="solar:round-arrow-right-linear" size="15" class="mt-px shrink-0 text-brand" />
            A buyer purchases through their link.
          </p>
          <p class="flex items-start gap-2">
            <Icon name="solar:round-arrow-right-linear" size="15" class="mt-px shrink-0 text-brand" />
            You pay this fixed reward from that sale — not before.
          </p>
        </div>
      </Transition>
      <input
        v-model.number="form.affiliateCommission"
        type="number"
        min="0"
        step="0.01"
        placeholder="e.g. 500"
        class="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand sm:w-1/2 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />
      <p
        v-if="form.affiliateCommission && form.affiliateCommission > 0"
        class="mt-1.5 text-xs text-brand dark:text-brand/80"
      >
        Creators will see: “Earn ₦{{
          Number(form.affiliateCommission).toLocaleString()
        }}
        by selling this product”
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <BaseInput
          v-model="form.SKU"
          label="SKU"
          placeholder="Optional"
        />
      </div>
      <!-- Status is chosen via the "Save as draft" / "Publish" buttons at the
           bottom of the form, not a dropdown. -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { notify } from '@kyvg/vue3-notification'
import HtmlDescriptionEditor from '~~/layers/seller/app/components/HtmlDescriptionEditor.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import { useAiApi } from '~~/layers/core/app/services/ai.api'

const props = defineProps<{
  form: {
    title: string
    description: string
    price: number | null
    discount: number | null
    affiliateCommission: number | null
    SKU: string
    status: string
  }
}>()

const showAffiliateHelp = ref(false)

// ── AI: improve / write description ──────────────────────────────────────────
const aiApi = useAiApi()
const aiBusy = ref(false)
// Enough to work with: either an existing description or at least a title to seed from.
const canEnhance = computed(
  () =>
    (props.form.description?.trim().length ?? 0) >= 3 ||
    (props.form.title?.trim().length ?? 0) >= 3,
)

const improveDescription = async () => {
  if (aiBusy.value || !canEnhance.value) return
  aiBusy.value = true
  try {
    // Seed from the description, falling back to the title so "Write with AI"
    // works before the seller has typed a description.
    const seed = props.form.description?.trim() || props.form.title?.trim() || ''
    const res = await aiApi.enhanceDescription(seed)
    if (res?.success && res.html) {
      props.form.description = res.html
      notify({ type: 'success', text: '✨ Description improved' })
    } else {
      notify({ type: 'error', text: 'Could not improve the description' })
    }
  } catch {
    notify({ type: 'error', text: 'AI is unavailable right now — try again' })
  } finally {
    aiBusy.value = false
  }
}
</script>
