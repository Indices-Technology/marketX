<template>
  <div
    class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <h2
      class="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-400"
    >
      Delivery Details
    </h2>

    <!-- Rendered here rather than inside either address branch so it shows on
         both the saved-address and new-address paths. This tick is the Meta
         opt-in for messaging the delivery number, so it has to be a real,
         visible choice — never an assumption buried in terms. -->
    <label
      v-if="form.phone"
      class="mb-4 flex cursor-pointer items-start gap-2.5 rounded-xl bg-gray-50 px-3.5 py-3 dark:bg-neutral-800/60"
    >
      <input
        v-model="form.notifyShipPhone"
        type="checkbox"
        class="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-brand focus:ring-brand dark:border-neutral-600"
      />
      <span class="min-w-0">
        <span
          class="block text-[13px] font-medium text-gray-800 dark:text-neutral-200"
        >
          Send delivery updates to {{ form.phone }} on WhatsApp
        </span>
        <span
          class="mt-0.5 block text-[11px] text-gray-500 dark:text-neutral-400"
        >
          Dispatch and arrival only. Payment and receipt details go to your
          account, not this number.
        </span>
      </span>
    </label>

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
            <Icon name="solar:trash-bin-trash-linear" size="15" />
          </button>
        </div>
      </button>

      <button
        type="button"
        class="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-[13px] font-semibold text-gray-500 transition-colors hover:border-brand hover:text-brand dark:border-neutral-700"
        @click="showNewAddressForm = !showNewAddressForm"
      >
        <Icon :name="showNewAddressForm ? 'solar:minus-circle-linear' : 'solar:add-circle-linear'" size="15" />
        {{
          showNewAddressForm
            ? 'Cancel new address'
            : 'Add / use different address'
        }}
      </button>

      <!-- Saved address with no phone on file. The carrier needs a number to
           deliver, so ask for just that instead of reopening the full form. -->
      <div
        v-if="!showNewAddressForm && selectedAddressId && !form.phone"
        class="pt-1"
      >
        <BaseInput
          v-model="form.phone"
          type="tel"
          label="Phone"
          required
          autocomplete="tel"
          hint="The rider calls this number on delivery"
          placeholder="+234 801 234 5678"
        />
      </div>
    </div>

    <!-- Address form -->
    <div v-if="!savedAddresses.length || showNewAddressForm" class="space-y-3">
      <!-- Required fields only. Email and postcode live behind the disclosure
           below — neither is needed to place or deliver an order, and on a
           phone every extra input is a reason to abandon. -->
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <BaseInput
            v-model="form.name"
            label="Full Name"
            required
            autocomplete="name"
            placeholder="Your full name"
          />
        </div>
        <div class="col-span-2">
          <BaseInput
            v-model="form.phone"
            type="tel"
            label="Phone"
            required
            autocomplete="tel"
            :hint="
              phoneIsVerified
                ? 'Your verified MarketX number'
                : 'The rider calls this number on delivery'
            "
            placeholder="+234 801 234 5678"
          />
        </div>
        <div class="col-span-2">
          <BaseInput
            v-model="form.address"
            label="Delivery Address"
            required
            autocomplete="street-address"
            placeholder="Street, area, nearest landmark"
          />
        </div>
        <div v-if="isNigeria">
          <label class="t-label mb-1.5 block">
            State <span class="ml-0.5 text-brand" aria-hidden="true">*</span>
          </label>
          <select
            v-model="form.state"
            autocomplete="address-level1"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            @change="emit('address-changed')"
          >
            <option value="">Select state</option>
            <option v-for="s in NIGERIA_STATES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div v-else>
          <BaseInput
            v-model="form.state"
            label="State / Province"
            autocomplete="address-level1"
            placeholder="State"
          />
        </div>
        <div>
          <BaseInput
            v-model="form.county"
            label="City / LGA"
            autocomplete="address-level2"
            placeholder="e.g. Ikeja"
          />
        </div>
        <div class="col-span-2">
          <label class="t-label mb-1.5 block">Country</label>
          <select
            v-model="form.country"
            autocomplete="country"
            class="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            @change="onCountryChange"
          >
            <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">
              {{ c.name }}
            </option>
          </select>
        </div>
      </div>

      <!-- Optional extras. Auto-opened outside Nigeria, where a postcode
           actually carries routing information. -->
      <button
        v-if="!showOptionalFields"
        type="button"
        class="flex max-w-full items-center gap-1.5 text-[12px] font-semibold text-gray-500 transition-colors hover:text-brand dark:text-neutral-400"
        @click="showOptional = true"
      >
        <Icon
          :name="form.email ? 'solar:letter-linear' : 'solar:add-circle-linear'"
          size="14"
          class="shrink-0"
        />
        <span class="truncate">
          {{
            form.email
              ? `Receipt to ${form.email} — change`
              : 'Add email or postcode (optional)'
          }}
        </span>
      </button>
      <div v-else class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <BaseInput
            v-model="form.email"
            type="email"
            label="Email"
            autocomplete="email"
            hint="Optional — for a payment receipt"
            placeholder="you@example.com"
          />
        </div>
        <div class="col-span-2">
          <BaseInput
            v-model="form.zipcode"
            label="Postal Code"
            autocomplete="postal-code"
            hint="Optional"
            placeholder="100001"
          />
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
            <Icon name="solar:bookmark-linear" size="14" />
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
            icon-left="solar:close-circle-linear"
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
  notifyShipPhone: boolean
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
const showOptional = ref(false)

// Outside Nigeria a postcode is real routing data, so open the extras there
// automatically. Inside it, they stay collapsed: a prefilled email is already
// correct, and surfacing it as an input just invites needless typing.
const showOptionalFields = computed(
  () => showOptional.value || !isNigeria.value,
)

// The phone captured at signup via WhatsApp OTP. Verified, so it beats
// retyping — and worth labelling as verified when it is what's in the field.
const verifiedPhone = computed(() =>
  profileStore.me?.phoneVerified ? profileStore.me?.phone || '' : '',
)
const phoneIsVerified = computed(
  () => !!verifiedPhone.value && props.form.phone === verifiedPhone.value,
)

const selectSavedAddress = (addr: ISavedAddress) => {
  selectedAddressId.value = addr.id
  showNewAddressForm.value = false
  props.form.name = addr.name
  props.form.address = addr.address
  props.form.county = addr.county
  props.form.state = addr.state
  props.form.zipcode = addr.zipcode
  props.form.country = addr.country
  // Older saved addresses predate the phone requirement; fall back to the
  // verified signup number rather than leaving the carrier without one.
  props.form.phone = addr.phone || verifiedPhone.value
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
          country: 'NG',
          phone: verifiedPhone.value,
        })
      }
    }
  } catch {
    /* non-fatal */
  }
}

onMounted(async () => {
  if (!profileStore.isLoggedIn) return
  await loadAddresses()
  // After addresses settle, so a phone stored on the chosen address wins.
  // Only fills a gap; never overwrites what the buyer already has.
  if (!props.form.phone && verifiedPhone.value) {
    props.form.phone = verifiedPhone.value
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

