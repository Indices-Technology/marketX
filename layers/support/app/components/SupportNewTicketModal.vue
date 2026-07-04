<template>
  <BaseModal
    :model-value="modelValue"
    :title="isDispute ? 'Open a dispute' : 'Contact support'"
    max-width="md"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="space-y-4">
      <p class="text-sm text-gray-500 dark:text-neutral-400">
        {{ isDispute
          ? 'Tell us what went wrong with this order. The seller and our team will be notified.'
          : 'Describe your issue and our team will get back to you — usually within 24 hours.' }}
      </p>

      <BaseInput
        v-if="!isLoggedIn"
        v-model="form.email"
        label="Your email"
        type="email"
        placeholder="you@example.com"
        :error="errors.email"
      />

      <BaseSelect
        v-if="!isDispute"
        v-model="form.category"
        label="Topic"
        :options="categoryOptions"
      />

      <BaseInput
        v-if="!isDispute"
        v-model="form.subject"
        label="Subject"
        placeholder="Brief summary"
        :error="errors.subject"
      />

      <BaseTextarea
        v-model="form.message"
        :label="isDispute ? 'What happened?' : 'Message'"
        :rows="5"
        placeholder="Give us as much detail as you can…"
        :error="errors.message"
      />

      <p v-if="serverError" class="text-sm font-medium text-red-500">{{ serverError }}</p>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <BaseButton variant="secondary" @click="$emit('update:modelValue', false)">Cancel</BaseButton>
        <BaseButton :loading="submitting" @click="submit">
          {{ isDispute ? 'Submit dispute' : 'Send' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useSupport, type SupportCategory } from '~~/layers/support/app/composables/useSupport'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseSelect from '~~/layers/ui/app/components/BaseSelect.vue'
import BaseTextarea from '~~/layers/ui/app/components/BaseTextarea.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    orderId?: number
    productId?: number
    sellerId?: string
    defaultCategory?: SupportCategory
    defaultSubject?: string
    /** When true, submits as an order dispute instead of a plain ticket. */
    dispute?: boolean
  }>(),
  { dispute: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [id: string]
}>()

const support = useSupport()
const profileStore = useProfileStore()
const isLoggedIn = computed(() => profileStore.isLoggedIn)
const isDispute = computed(() => props.dispute && !!props.orderId)

const categoryOptions = [
  { label: 'My order', value: 'ORDER' },
  { label: 'Payment', value: 'PAYMENT' },
  { label: 'Delivery', value: 'DELIVERY' },
  { label: 'Account & security', value: 'ACCOUNT' },
  { label: 'A seller', value: 'SELLER' },
  { label: 'A product', value: 'PRODUCT' },
  { label: 'Refund', value: 'REFUND' },
  { label: 'Something else', value: 'OTHER' },
]

const form = reactive({
  email: (profileStore.me?.email as string) || '',
  category: (props.defaultCategory || 'OTHER') as SupportCategory,
  subject: props.defaultSubject || '',
  message: '',
})

const errors = reactive<{ email?: string; subject?: string; message?: string }>({})
const serverError = ref('')
const submitting = ref(false)

function validate(): boolean {
  errors.email = errors.subject = errors.message = undefined
  let ok = true
  if (!isLoggedIn.value && !/^\S+@\S+\.\S+$/.test(form.email)) {
    errors.email = 'A valid email is required'
    ok = false
  }
  if (!isDispute.value && form.subject.trim().length < 3) {
    errors.subject = 'Add a short subject'
    ok = false
  }
  if (form.message.trim().length < (isDispute.value ? 10 : 5)) {
    errors.message = 'Please add more detail'
    ok = false
  }
  return ok
}

async function submit() {
  serverError.value = ''
  if (!validate()) return
  submitting.value = true
  try {
    let res: { data?: { id: string } }
    if (isDispute.value) {
      res = (await support.openDispute(props.orderId!, {
        message: form.message,
        category: form.category as never,
      })) as never
    } else {
      res = (await support.createTicket({
        subject: form.subject,
        message: form.message,
        category: form.category,
        email: isLoggedIn.value ? undefined : form.email,
        orderId: props.orderId,
        productId: props.productId,
        sellerId: props.sellerId,
        source: props.orderId ? 'ORDER' : 'WEB',
      })) as never
    }
    form.message = ''
    form.subject = ''
    emit('created', res?.data?.id || '')
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string; message?: string }; statusMessage?: string }
    serverError.value =
      err?.data?.statusMessage || err?.data?.message || err?.statusMessage || 'Something went wrong. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>
