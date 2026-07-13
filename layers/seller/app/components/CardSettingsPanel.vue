<template>
  <div
    class="rounded-2xl border border-gray-200 dark:border-neutral-800"
  >
    <button
      class="flex w-full items-center justify-between px-4 py-3 text-[13px] font-semibold text-gray-700 dark:text-neutral-300"
      @click="open = !open"
    >
      <span class="flex items-center gap-2">
        <Icon name="solar:settings-linear" size="16" />
        Card settings
        <span class="text-[11px] font-normal text-gray-400">
          (only you can see this)
        </span>
      </span>
      <Icon
        name="solar:alt-arrow-down-linear"
        size="16"
        class="transition-transform"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <div
      v-if="open"
      class="space-y-3 border-t border-gray-100 px-4 py-4 dark:border-neutral-800"
    >
      <p class="text-[11px] font-bold uppercase tracking-wider text-gray-400">
        Show on card
      </p>

      <div v-for="row in rows" :key="row.key">
        <div class="flex items-center justify-between">
          <span class="text-[13px] text-gray-700 dark:text-neutral-300">{{
            row.label
          }}</span>
          <button
            type="button"
            class="relative h-5 w-9 rounded-full transition-colors"
            :class="form[row.key] ? 'bg-brand' : 'bg-gray-200 dark:bg-neutral-700'"
            @click="form[row.key] = !form[row.key]"
          >
            <span
              class="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
              :class="form[row.key] ? 'translate-x-4' : 'translate-x-0.5'"
            />
          </button>
        </div>

        <!-- Email: editable here (only place it lives). Phone/address reuse the
             store's own fields, so we just hint where to set them. -->
        <input
          v-if="row.key === 'showEmail' && form.showEmail"
          v-model="email"
          type="email"
          placeholder="Business email"
          class="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-[13px] text-gray-900 focus:border-brand focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
        />
        <p
          v-else-if="row.hintWhenEmpty && form[row.key] && !row.hintWhenEmpty()"
          class="mt-1 text-[11px] text-amber-600 dark:text-amber-400"
        >
          Add this in your store settings to show it.
        </p>
      </div>

      <BaseButton
        variant="primary"
        size="sm"
        class="w-full"
        :loading="saving"
        @click="save"
      >
        Save
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { notify } from '@kyvg/vue3-notification'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { useSellerApi } from '../services/seller.services'
import {
  resolveCardSettings,
  type CardSettings,
} from '~~/shared/utils/cardSettings'

const props = defineProps<{ seller: any }>()
const emit = defineEmits<{
  (e: 'saved', patch: { cardSettings: CardSettings; store_email: string }): void
}>()

const open = ref(false)
const saving = ref(false)
const form = reactive<CardSettings>(resolveCardSettings(null))
const email = ref('')

const rows: {
  key: keyof CardSettings
  label: string
  hintWhenEmpty?: () => boolean
}[] = [
  { key: 'showDescription', label: 'Description' },
  { key: 'showRating', label: 'Rating & reviews' },
  { key: 'showFollowers', label: 'Followers' },
  { key: 'showProducts', label: 'Products count' },
  {
    key: 'showPhone',
    label: 'Phone number',
    hintWhenEmpty: () => !!props.seller?.store_phone,
  },
  { key: 'showEmail', label: 'Email' },
  {
    key: 'showAddress',
    label: 'Address',
    hintWhenEmpty: () => !!props.seller?.store_location,
  },
]

watch(
  () => props.seller,
  (s) => {
    if (!s) return
    Object.assign(form, resolveCardSettings(s.cardSettings))
    email.value = s.store_email || ''
  },
  { immediate: true },
)

const save = async () => {
  if (!props.seller?.id) return
  saving.value = true
  try {
    await useSellerApi().updateSellerProfile(props.seller.id, {
      cardSettings: { ...form },
      store_email: email.value,
    })
    emit('saved', { cardSettings: { ...form }, store_email: email.value })
    notify({ type: 'success', text: 'Card updated' })
    open.value = false
  } catch {
    notify({ type: 'error', text: 'Could not save card settings' })
  } finally {
    saving.value = false
  }
}
</script>
