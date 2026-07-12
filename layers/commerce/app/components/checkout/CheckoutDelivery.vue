<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <h2
      class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400"
    >
      Delivery Details
    </h2>

    <!-- Saved address cards -->
    <div v-if="savedAddresses.length" class="mb-4 space-y-2">
      <button
        v-for="addr in savedAddresses"
        :key="addr.id"
        type="button"
        :class="
          selectedAddressId === addr.id
            ? 'border-brand bg-brand/5 dark:bg-brand/10'
            : 'border-gray-200 hover:border-gray-200 dark:border-neutral-800 dark:hover:border-neutral-700'
        "
        class="w-full rounded-xl border-2 p-3.5 text-left transition-all"
        @click="selectSavedAddress(addr)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2.5">
            <div
              class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
              :class="
                selectedAddressId === addr.id
                  ? 'border-brand'
                  : 'border-gray-300 dark:border-neutral-600'
              "
            >
              <div
                v-if="selectedAddressId === addr.id"
                class="h-2 w-2 rounded-full bg-brand"
              />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <p
                  class="text-[13px] font-semibold text-gray-900 dark:text-neutral-100"
                >
                  {{ addr.name }}
                </p>
                <span
                  v-if="addr.label"
                  class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-neutral-700 dark:text-neutral-400"
                  >{{ addr.label }}</span
                >
                <span
                  v-if="addr.isDefault"
                  class="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand"
                  >Default</span
                >
              </div>
              <p class="text-[12px] text-gray-500 dark:text-neutral-400">
                {{ addr.address }}, {{ addr.county
                }}{{ addr.state ? ', ' + addr.state : '' }},
                {{ addr.country }}
              </p>
              <p
                v-if="addr.phone"
                class="text-[11px] text-gray-400 dark:text-neutral-500"
              >
                {{ addr.phone }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            @click.stop="deleteAddress(addr.id)"
          >
            <Icon name="mdi:trash-can-outline" size="15" />
          </button>
        </div>
      </button>

      <button
        type="button"
        class="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-[13px] font-semibold text-gray-500 transition-colors hover:border-brand hover:text-brand dark:border-neutral-700"
        @click="showNewAddressForm = !showNewAddressForm"
      >
        <Icon :name="showNewAddressForm ? 'mdi:minus' : 'mdi:plus'" size="15" />
        {{
          showNewAddressForm
            ? 'Cancel new address'
            : 'Add / use different address'
        }}
      </button>
    </div>

    <!-- Address form -->
    <div v-if="!savedAddresses.length || showNewAddressForm" class="space-y-3">
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <BaseInput v-model="form.name" label="Full Name" placeholder="Your full name" />
        </div>
        <div class="col-span-2">
          <BaseInput
            v-model="form.email"
            type="email"
            label="Email"
            hint="Used for payment receipt"
            placeholder="you@example.com"
          />
        </div>
        <div class="col-span-2">
          <BaseInput v-model="form.address" label="Delivery Address" placeholder="Street address" />
        </div>
        <div v-if="isNigeria">
          <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-neutral-400">State</label>
          <select
            v-model="form.state"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            @change="emit('address-changed')"
          >
            <option value="">Select state</option>
            <option v-for="s in NIGERIA_STATES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div v-else>
          <BaseInput v-model="form.state" label="State / Province" placeholder="State" />
        </div>
        <div>
          <BaseInput v-model="form.county" label="City / LGA" placeholder="e.g. Ikeja" />
        </div>
        <div>
          <BaseInput v-model="form.zipcode" label="Postal Code" placeholder="100001" />
        </div>
        <div class="col-span-2">
          <BaseInput v-model="form.phone" type="tel" label="Phone" placeholder="+2348012345678" />
        </div>
        <div>
          <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-neutral-400">Country</label>
          <select
            v-model="form.country"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            @change="onCountryChange"
          >
            <option value="">Select country</option>
            <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Save address row -->
      <div
        v-if="form.name && form.address && form.country"
        class="flex items-center gap-2 pt-1"
      >
        <template v-if="!showSavePanel">
          <button
            type="button"
            class="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12px] font-semibold text-gray-600 transition-colors hover:border-brand hover:text-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400"
            @click="showSavePanel = true"
          >
            <Icon name="mdi:bookmark-plus-outline" size="14" />
            Save address
          </button>
        </template>
        <template v-else>
          <input
            v-model="saveLabel"
            type="text"
            placeholder="Label (e.g. Home, Work)"
            maxlength="20"
            class="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[12px] text-gray-700 placeholder-gray-400 focus:border-brand focus:outline-none dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
          />
          <BaseButton
            type="button"
            variant="primary"
            size="sm"
            :loading="isSaving"
            @click="handleSaveAddress"
          >
            Save
          </BaseButton>
          <BaseButton
            type="button"
            variant="icon"
            size="xs"
            icon-left="mdi:close"
            @click="showSavePanel = false"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  useAddressApi,
  type ISavedAddress,
} from '~~/layers/commerce/app/services/address.api'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { notify } from '@kyvg/vue3-notification'
import { NIGERIA_STATES } from '~~/shared/utils/locations'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'

interface DeliveryForm {
  name: string
  email: string
  address: string
  county: string
  state: string
  zipcode: string
  country: string
  phone: string
}

const props = defineProps<{ form: DeliveryForm }>()
const emit = defineEmits<{ 'address-changed': [] }>()

const isNigeria = computed(() => (props.form.country || 'NG') === 'NG')

const addressApi = useAddressApi()
const profileStore = useProfileStore()

const savedAddresses = ref<ISavedAddress[]>([])
const selectedAddressId = ref<number | null>(null)
const showNewAddressForm = ref(false)
const showSavePanel = ref(false)
const saveLabel = ref('')
const isSaving = ref(false)

const selectSavedAddress = (addr: ISavedAddress) => {
  selectedAddressId.value = addr.id
  showNewAddressForm.value = false
  props.form.name = addr.name
  props.form.address = addr.address
  props.form.county = addr.county
  props.form.state = addr.state
  props.form.zipcode = addr.zipcode
  props.form.country = addr.country
  props.form.phone = addr.phone
  emit('address-changed')
}

const onCountryChange = () => {
  selectedAddressId.value = null
  emit('address-changed')
}

const loadAddresses = async () => {
  try {
    const result = await addressApi.getAddresses()
    savedAddresses.value = result.data
    const def =
      result.data.find((a: ISavedAddress) => a.isDefault) || result.data[0]
    if (def) selectSavedAddress(def)
  } catch {
    /* non-fatal */
  }
}

const handleSaveAddress = async () => {
  if (
    !props.form.name.trim() ||
    !props.form.address.trim() ||
    !props.form.country
  )
    return
  isSaving.value = true
  try {
    const result = await addressApi.saveAddress({
      label: saveLabel.value || undefined,
      name: props.form.name,
      address: props.form.address,
      county: props.form.county,
      state: props.form.state,
      zipcode: props.form.zipcode,
      country: props.form.country,
      phone: props.form.phone,
    })
    savedAddresses.value.push(result.data)
    if (savedAddresses.value.length === 1) selectSavedAddress(result.data)
    showSavePanel.value = false
    showNewAddressForm.value = false
    saveLabel.value = ''
    notify({ type: 'success', text: 'Address saved!' })
  } finally {
    isSaving.value = false
  }
}

const deleteAddress = async (id: number) => {
  try {
    await addressApi.deleteAddress(id)
    savedAddresses.value = savedAddresses.value.filter((a) => a.id !== id)
    if (selectedAddressId.value === id) {
      const next =
        savedAddresses.value.find((a) => a.isDefault) || savedAddresses.value[0]
      if (next) {
        selectSavedAddress(next)
      } else {
        selectedAddressId.value = null
        Object.assign(props.form, {
          name: '',
          address: '',
          county: '',
          state: '',
          zipcode: '',
          country: '',
          phone: '',
        })
      }
    }
  } catch {
    /* non-fatal */
  }
}

onMounted(async () => {
  if (profileStore.isLoggedIn) {
    await loadAddresses()
  }
})

defineExpose({ loadAddresses })

const COUNTRIES = [
  { code: 'NG', name: 'Nigeria' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'SN', name: 'Senegal' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'CM', name: 'Cameroon' },
  { code: 'TZ', name: 'Tanzania' },
  { code: 'UG', name: 'Uganda' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'MA', name: 'Morocco' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'AE', name: 'UAE' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
]
</script>

