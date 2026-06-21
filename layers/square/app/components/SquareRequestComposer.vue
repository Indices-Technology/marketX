<template>
  <BaseModal
    :model-value="true"
    title="Post a request"
    max-width="md"
    @update:model-value="(v) => !v && emit('close')"
  >
    <div class="space-y-4">
      <p class="text-[13px] text-gray-500 dark:text-neutral-400">
        Tell sellers in
        <span class="font-semibold text-gray-700 dark:text-neutral-200">{{ squareName }}</span>
        what you're looking for. They'll respond with products — you buy safely on
        MarketX, with your payment held until delivery.
      </p>

      <BaseInput
        v-model="form.title"
        label="What are you looking for? *"
        placeholder="e.g. Navy senator suit, size XL"
        :error="errors.title"
      />

      <BaseSelect
        v-model="form.categoryId"
        label="Category"
        :options="categoryOptions"
        placeholder="Any category"
      />

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-neutral-400">
            Budget min (₦)
          </label>
          <input
            v-model.number="budgetMinMajor"
            type="number"
            min="0"
            placeholder="0"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-neutral-400">
            Budget max (₦)
          </label>
          <input
            v-model.number="budgetMaxMajor"
            type="number"
            min="0"
            placeholder="Any"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
        </div>
      </div>

      <BaseSelect
        v-model="form.condition"
        label="Condition"
        :options="conditionOptions"
        placeholder="Any condition"
      />

      <div class="grid grid-cols-2 gap-3">
        <BaseInput v-model="form.sizeSpec" label="Size / spec" placeholder="e.g. UK 9" />
        <BaseInput v-model="form.deliverTo" label="Deliver to" placeholder="e.g. Yaba, Lagos" />
      </div>

      <BaseTextarea
        v-model="form.note"
        label="Notes"
        :rows="3"
        placeholder="Any extra detail — colour, brand, urgency…"
        hint="Sharing phone numbers or WhatsApp here will be hidden automatically."
      />

      <div class="space-y-2 rounded-xl bg-gray-50 p-3 dark:bg-neutral-800/50">
        <label class="flex items-center justify-between gap-3">
          <span class="text-[13px] text-gray-700 dark:text-neutral-300">Only verified sellers can respond</span>
          <input v-model="form.respondersOnlyVerified" type="checkbox" class="accent-brand" />
        </label>
        <label class="flex items-center justify-between gap-3">
          <span class="text-[13px] text-gray-700 dark:text-neutral-300">Post anonymously</span>
          <input v-model="form.isAnonymous" type="checkbox" class="accent-brand" />
        </label>
      </div>

      <p v-if="submitError" class="text-[13px] text-brand">{{ submitError }}</p>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">Cancel</BaseButton>
      <BaseButton variant="primary" :loading="submitting" @click="submit">
        Post request
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseSelect from '~~/layers/ui/app/components/BaseSelect.vue'
import BaseTextarea from '~~/layers/ui/app/components/BaseTextarea.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { useSquareApi } from '~~/layers/square/app/services/square.api'
import { useProductApi } from '~~/layers/commerce/app/services/product.api'

const props = defineProps<{ slug: string; squareName: string }>()
const emit = defineEmits<{ close: []; created: [request: any] }>()

const squareApi = useSquareApi()
const productApi = useProductApi()

const form = reactive({
  title: '',
  categoryId: '' as string | number,
  condition: '' as string,
  sizeSpec: '',
  deliverTo: '',
  note: '',
  respondersOnlyVerified: false,
  isAnonymous: false,
})
const budgetMinMajor = ref<number | null>(null)
const budgetMaxMajor = ref<number | null>(null)

const errors = reactive<{ title?: string }>({})
const submitError = ref('')
const submitting = ref(false)

const conditionOptions = [
  { label: 'New (with tags)', value: 'NEW_WITH_TAGS' },
  { label: 'Like new', value: 'LIKE_NEW' },
  { label: 'Good', value: 'GOOD' },
  { label: 'Fair', value: 'FAIR' },
]

const categoryOptions = ref<Array<{ label: string; value: number }>>([])

onMounted(async () => {
  try {
    const res: any = await productApi.getCategories()
    categoryOptions.value = (res?.data ?? []).map((c: { id: number; name: string }) => ({
      label: c.name,
      value: c.id,
    }))
  } catch {
    /* category list is optional */
  }
})

const submit = async () => {
  errors.title = undefined
  submitError.value = ''
  if (!form.title || form.title.trim().length < 3) {
    errors.title = 'Tell us what you are looking for'
    return
  }
  submitting.value = true
  try {
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      visibility: 'square',
      respondersOnlyVerified: form.respondersOnlyVerified,
      isAnonymous: form.isAnonymous,
    }
    if (form.categoryId) payload.categoryId = Number(form.categoryId)
    if (form.condition) payload.condition = form.condition
    if (form.sizeSpec.trim()) payload.sizeSpec = form.sizeSpec.trim()
    if (form.deliverTo.trim()) payload.deliverTo = form.deliverTo.trim()
    if (form.note.trim()) payload.note = form.note.trim()
    if (budgetMinMajor.value != null) payload.budgetMin = Math.round(budgetMinMajor.value * 100)
    if (budgetMaxMajor.value != null) payload.budgetMax = Math.round(budgetMaxMajor.value * 100)

    const res = await squareApi.createRequest(props.slug, payload)
    emit('created', res.data)
    emit('close')
  } catch (e: any) {
    submitError.value =
      e?.data?.statusMessage || e?.statusMessage || 'Could not post your request. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>
