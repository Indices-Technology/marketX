<template>
  <BaseModal
    :model-value="open"
    :title="isCreate ? 'New square' : `Edit ${square?.name}`"
    max-width="md"
    @update:model-value="(v) => !v && emit('close')"
  >
    <div class="space-y-4">
      <div>
        <BaseInput v-model="form.name" label="Name *" placeholder="e.g. Computer Village" />
      </div>

      <div v-if="isCreate">
        <BaseInput
          v-model="form.slug"
          label="Slug *"
          placeholder="computer-village"
        />
        <p class="mt-1 text-[11px] text-gray-400 dark:text-neutral-500">
          Lowercase letters, numbers and hyphens. Used in the URL.
        </p>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">Type</label>
        <select
          v-model="form.type"
          class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        >
          <option value="CATEGORY">Category (online-first)</option>
          <option value="GEOGRAPHIC">Geographic (physical market)</option>
        </select>
      </div>

      <div v-if="isCreate">
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">
          Owner / Chairman
          <span class="font-normal text-gray-400">(optional)</span>
        </label>
        <div class="relative">
          <input
            v-model="ownerSearch"
            placeholder="Search a user by name or email…"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <button
            v-if="ownerProfileId"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-700"
            @click="clearOwner"
          >
            <Icon name="solar:close-circle-linear" size="15" />
          </button>

          <!-- Results -->
          <div
            v-if="ownerResults.length && !ownerProfileId"
            class="absolute left-0 right-0 top-full z-10 mt-1 max-h-52 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-neutral-700 dark:bg-neutral-800"
          >
            <button
              v-for="u in ownerResults"
              :key="u.id"
              type="button"
              class="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-neutral-700"
              @click="pickOwner(u)"
            >
              <img :src="avatarSrc(u.avatar, u.username)" class="h-6 w-6 shrink-0 rounded-full object-cover" alt="" />
              <div class="min-w-0">
                <p class="truncate text-[13px] font-medium text-gray-900 dark:text-neutral-100">{{ u.username || 'user' }}</p>
                <p class="truncate text-[11px] text-gray-400 dark:text-neutral-500">{{ u.email }}</p>
              </div>
            </button>
          </div>
        </div>
        <p v-if="ownerProfileId" class="mt-1 text-[11px] text-brand">
          Will be made Chairman and notified.
        </p>
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">Description</label>
        <textarea
          v-model="form.description"
          rows="2"
          maxlength="500"
          placeholder="What is this square about?"
          class="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <BaseInput v-model="form.city" label="City" placeholder="Lagos" />
        <BaseInput v-model="form.state" label="State" placeholder="Lagos" />
      </div>

      <div v-if="form.type === 'GEOGRAPHIC'">
        <BaseInput v-model="form.physicalAddress" label="Physical address" placeholder="Otigba St, Ikeja" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <!-- Icon -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">Icon</label>
          <div
            class="relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-brand dark:border-neutral-700 dark:bg-neutral-800"
            @click="pickFile('icon')"
          >
            <img v-if="form.iconUrl" :src="form.iconUrl" class="h-full w-full object-cover" alt="" />
            <div v-else-if="uploading.icon" class="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <div v-else class="flex flex-col items-center gap-1 text-gray-400 dark:text-neutral-500">
              <Icon name="solar:gallery-add-linear" size="24" />
              <span class="text-[11px]">Upload icon</span>
            </div>
            <button
              v-if="form.iconUrl && !uploading.icon"
              type="button"
              class="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              @click.stop="form.iconUrl = ''"
            >
              <Icon name="solar:close-circle-linear" size="13" />
            </button>
          </div>
        </div>
        <!-- Banner -->
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">Banner</label>
          <div
            class="relative flex aspect-video w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-brand dark:border-neutral-700 dark:bg-neutral-800"
            @click="pickFile('banner')"
          >
            <img v-if="form.bannerUrl" :src="form.bannerUrl" class="h-full w-full object-cover" alt="" />
            <div v-else-if="uploading.banner" class="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <div v-else class="flex flex-col items-center gap-1 text-gray-400 dark:text-neutral-500">
              <Icon name="solar:gallery-add-linear" size="24" />
              <span class="text-[11px]">Upload banner</span>
            </div>
            <button
              v-if="form.bannerUrl && !uploading.banner"
              type="button"
              class="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              @click.stop="form.bannerUrl = ''"
            >
              <Icon name="solar:close-circle-linear" size="13" />
            </button>
          </div>
        </div>
        <input ref="iconInput" type="file" accept="image/*" class="hidden" @change="onFile('icon', $event)" />
        <input ref="bannerInput" type="file" accept="image/*" class="hidden" @change="onFile('banner', $event)" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">Accent colour</label>
          <div class="flex items-center gap-2">
            <input
              type="color"
              :value="form.accentColor || '#F02C56'"
              class="h-9 w-10 shrink-0 cursor-pointer rounded border border-gray-200 dark:border-neutral-700"
              @input="form.accentColor = ($event.target as HTMLInputElement).value"
            />
            <BaseInput v-model="form.accentColor" placeholder="#F02C56" />
          </div>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">Association cut %</label>
          <input
            v-model.number="form.associationCutPercent"
            type="number"
            min="0"
            max="5"
            step="0.1"
            class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
          />
          <p class="mt-1 text-[11px] text-gray-400 dark:text-neutral-500">Share of member sales (0–5%).</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <BaseButton variant="secondary" class="flex-1" @click="emit('close')">Cancel</BaseButton>
        <BaseButton
          variant="primary"
          class="flex-1"
          :loading="submitting"
          :disabled="submitting || !canSubmit"
          @click="submit"
        >
          {{ isCreate ? 'Create square' : 'Save changes' }}
        </BaseButton>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { notify } from '@kyvg/vue3-notification'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'
import { useMediaUpload } from '~~/layers/core/app/composables/useMediaUpload'
import { avatarSrc } from '~~/layers/core/app/utils/cloudinary'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'

const props = defineProps<{ open: boolean; square: any | null }>()
const emit = defineEmits<{ close: []; saved: [square: any] }>()

const adminApi = useAdminApi()
const isCreate = computed(() => !props.square)
const submitting = ref(false)

const form = reactive({
  name: '',
  slug: '',
  type: 'CATEGORY' as 'CATEGORY' | 'GEOGRAPHIC',
  description: '',
  city: '',
  state: '',
  physicalAddress: '',
  iconUrl: '',
  bannerUrl: '',
  accentColor: '',
  associationCutPercent: 0.5,
})

// ── Image uploads (icon / banner) ───────────────────────────────────────────
const { uploadMedia } = useMediaUpload()
const iconInput = ref<HTMLInputElement | null>(null)
const bannerInput = ref<HTMLInputElement | null>(null)
const uploading = reactive({ icon: false, banner: false })

function pickFile(kind: 'icon' | 'banner') {
  ;(kind === 'icon' ? iconInput : bannerInput).value?.click()
}

async function onFile(kind: 'icon' | 'banner', e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading[kind] = true
  try {
    const res = await uploadMedia({ file })
    if (kind === 'icon') form.iconUrl = res.url
    else form.bannerUrl = res.url
  } catch {
    notify({ type: 'error', text: 'Upload failed — try again' })
  } finally {
    uploading[kind] = false
    input.value = ''
  }
}

// ── Owner (Chairman) picker — create only ───────────────────────────────────
const ownerSearch = ref('')
const ownerResults = ref<any[]>([])
const ownerProfileId = ref<string | null>(null)
const ownerLabel = ref('')
let ownerTimer: ReturnType<typeof setTimeout>

watch(ownerSearch, (q) => {
  clearTimeout(ownerTimer)
  // Keep the picked selection while the text still matches it.
  if (ownerProfileId.value && q === ownerLabel.value) return
  if (ownerProfileId.value) {
    ownerProfileId.value = null
    ownerLabel.value = ''
  }
  const query = q.trim()
  if (query.length < 2) {
    ownerResults.value = []
    return
  }
  ownerTimer = setTimeout(async () => {
    try {
      const res: any = await adminApi.getUsers({ search: query, limit: 6 })
      ownerResults.value = res?.items ?? []
    } catch {
      ownerResults.value = []
    }
  }, 300)
})

function pickOwner(u: any) {
  ownerProfileId.value = u.id
  ownerLabel.value = u.username || u.email
  ownerSearch.value = u.username || u.email
  ownerResults.value = []
}
function clearOwner() {
  ownerProfileId.value = null
  ownerLabel.value = ''
  ownerSearch.value = ''
  ownerResults.value = []
}

// Track whether the admin has hand-edited the slug so auto-gen doesn't clobber it.
const slugTouched = ref(false)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    const s = props.square
    slugTouched.value = !!s
    clearOwner()
    Object.assign(form, {
      name: s?.name ?? '',
      slug: s?.slug ?? '',
      type: s?.type ?? 'CATEGORY',
      description: s?.description ?? '',
      city: s?.city ?? '',
      state: s?.state ?? '',
      physicalAddress: s?.physicalAddress ?? '',
      iconUrl: s?.iconUrl ?? '',
      bannerUrl: s?.bannerUrl ?? '',
      accentColor: s?.accentColor ?? '',
      associationCutPercent: s?.associationCutPercent ?? 0.5,
    })
  },
  { immediate: true },
)

// Auto-slug from name on create until the admin edits the slug field.
watch(
  () => form.name,
  (name) => {
    if (isCreate.value && !slugTouched.value) {
      form.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }
  },
)
watch(
  () => form.slug,
  () => {
    if (props.open && isCreate.value) slugTouched.value = true
  },
)

const canSubmit = computed(
  () =>
    form.name.trim().length >= 3 &&
    (!isCreate.value || form.slug.trim().length >= 3) &&
    !uploading.icon &&
    !uploading.banner,
)

function buildPayload() {
  const p: Record<string, unknown> = {
    name: form.name.trim(),
    type: form.type,
    associationCutPercent: Number(form.associationCutPercent) || 0.5,
  }
  if (isCreate.value) {
    p.slug = form.slug.trim()
    if (ownerProfileId.value) p.ownerProfileId = ownerProfileId.value
  }
  if (form.description.trim()) p.description = form.description.trim()
  if (form.city.trim()) p.city = form.city.trim()
  if (form.state.trim()) p.state = form.state.trim()
  if (form.physicalAddress.trim()) p.physicalAddress = form.physicalAddress.trim()
  if (form.iconUrl.trim()) p.iconUrl = form.iconUrl.trim()
  if (form.bannerUrl.trim()) p.bannerUrl = form.bannerUrl.trim()
  if (form.accentColor.trim()) p.accentColor = form.accentColor.trim()
  return p
}

async function submit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    const payload = buildPayload()
    const res = isCreate.value
      ? await adminApi.createSquare(payload)
      : await adminApi.updateSquare(props.square.slug, payload)
    notify({ type: 'success', text: isCreate.value ? 'Square created' : 'Square updated' })
    emit('saved', res?.data ?? res)
  } catch {
    // BaseApiClient surfaces the error toast (e.g. duplicate slug / invalid URL)
  } finally {
    submitting.value = false
  }
}
</script>
