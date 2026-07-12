<template>
  <div class="mx-auto max-w-3xl space-y-6 p-6">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">Categories</h1>
        <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
          Manage the product catalogue taxonomy
        </p>
      </div>
      <BaseButton size="sm" variant="primary" @click="openCreate">
        <Icon name="solar:add-circle-linear" size="15" /> New category
      </BaseButton>
    </div>

    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div v-if="pending && !data" class="divide-y divide-gray-50 dark:divide-neutral-800">
        <div v-for="i in 6" :key="i" class="flex items-center gap-3 px-4 py-3.5">
          <div class="h-8 w-8 animate-pulse rounded-lg bg-gray-100 dark:bg-neutral-800" />
          <div class="h-3 w-40 animate-pulse rounded bg-gray-100 dark:bg-neutral-800" />
        </div>
      </div>

      <div v-else-if="!categories.length" class="flex flex-col items-center justify-center py-16 text-center text-gray-400 dark:text-neutral-500">
        <Icon name="solar:widget-linear" size="30" class="mb-2 opacity-40" />
        <p class="text-[13px]">No categories yet</p>
      </div>

      <table v-else class="w-full text-[13px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500">
            <th class="px-4 py-3">Category</th>
            <th class="px-4 py-3">Slug</th>
            <th class="px-4 py-3">Products</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr v-for="c in categories" :key="c.id">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <div class="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800">
                  <img v-if="c.thumbnailCatUrl" :src="c.thumbnailCatUrl" class="h-full w-full object-cover" alt="" />
                  <Icon v-else name="solar:widget-linear" size="15" class="text-gray-400" />
                </div>
                <span class="font-medium text-gray-900 dark:text-neutral-100">{{ c.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-neutral-400">{{ c.slug }}</td>
            <td class="px-4 py-3 text-gray-500 dark:text-neutral-400">{{ c._count?.products ?? 0 }}</td>
            <td class="px-4 py-3 text-right">
              <div class="flex items-center justify-end gap-1.5">
                <button
                  class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                  title="Edit"
                  @click="openEdit(c)"
                >
                  <Icon name="solar:pen-linear" size="16" />
                </button>
                <button
                  class="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  title="Delete"
                  @click="remove(c)"
                >
                  <Icon name="solar:trash-bin-trash-linear" size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create / edit modal -->
    <BaseModal
      :model-value="formOpen"
      :title="editing ? 'Edit category' : 'New category'"
      max-width="sm"
      @update:model-value="(v) => !v && (formOpen = false)"
    >
      <div class="space-y-4">
        <BaseInput v-model="form.name" label="Name *" placeholder="e.g. Fashion" />
        <div>
          <BaseInput v-model="form.slug" label="Slug *" placeholder="fashion" />
          <p class="mt-1 text-[11px] text-gray-400 dark:text-neutral-500">Lowercase letters, numbers and hyphens.</p>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-neutral-300">Thumbnail</label>
          <div
            class="relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-colors hover:border-brand dark:border-neutral-700 dark:bg-neutral-800"
            @click="thumbInput?.click()"
          >
            <img v-if="form.thumbnailCatUrl" :src="form.thumbnailCatUrl" class="h-full w-full object-cover" alt="" />
            <div v-else-if="uploadingThumb" class="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            <Icon v-else name="solar:gallery-add-linear" size="22" class="text-gray-400" />
            <button
              v-if="form.thumbnailCatUrl && !uploadingThumb"
              type="button"
              class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              @click.stop="form.thumbnailCatUrl = ''"
            >
              <Icon name="solar:close-circle-linear" size="12" />
            </button>
          </div>
          <input ref="thumbInput" type="file" accept="image/*" class="hidden" @change="onThumb" />
        </div>
      </div>

      <template #footer>
        <div class="flex gap-3">
          <BaseButton variant="secondary" class="flex-1" @click="formOpen = false">Cancel</BaseButton>
          <BaseButton
            variant="primary"
            class="flex-1"
            :loading="saving"
            :disabled="saving || uploadingThumb || form.name.trim().length < 2 || form.slug.trim().length < 2"
            @click="save"
          >
            {{ editing ? 'Save' : 'Create' }}
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { notify } from '@kyvg/vue3-notification'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'
import { useMediaUpload } from '~~/layers/core/app/composables/useMediaUpload'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'

definePageMeta({ middleware: 'admin', layout: 'admin-layout' })

const adminApi = useAdminApi()
const { uploadMedia } = useMediaUpload()

// Client-only: admin auth (Bearer token) isn't available during SSR.
const { data, pending, refresh } = useAsyncData(
  'admin-categories',
  () => adminApi.getAdminCategories(),
  { lazy: true, server: false },
)
const categories = computed(() => (data.value as any)?.items ?? [])

// ── Form ──────────────────────────────────────────────────────────────────
const formOpen = ref(false)
const editing = ref<any>(null)
const saving = ref(false)
const form = reactive({ name: '', slug: '', thumbnailCatUrl: '' })
const slugTouched = ref(false)

function openCreate() {
  editing.value = null
  slugTouched.value = false
  Object.assign(form, { name: '', slug: '', thumbnailCatUrl: '' })
  formOpen.value = true
}
function openEdit(c: any) {
  editing.value = c
  slugTouched.value = true
  Object.assign(form, { name: c.name, slug: c.slug, thumbnailCatUrl: c.thumbnailCatUrl ?? '' })
  formOpen.value = true
}

watch(
  () => form.name,
  (name) => {
    if (!editing.value && !slugTouched.value)
      form.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  },
)
watch(() => form.slug, () => { if (formOpen.value) slugTouched.value = true })

// Thumbnail upload
const thumbInput = ref<HTMLInputElement | null>(null)
const uploadingThumb = ref(false)
async function onThumb(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploadingThumb.value = true
  try {
    const res = await uploadMedia({ file })
    form.thumbnailCatUrl = res.url
  } catch {
    notify({ type: 'error', text: 'Upload failed — try again' })
  } finally {
    uploadingThumb.value = false
    input.value = ''
  }
}

async function save() {
  if (saving.value) return
  saving.value = true
  try {
    const payload: any = { name: form.name.trim(), slug: form.slug.trim() }
    if (form.thumbnailCatUrl.trim()) payload.thumbnailCatUrl = form.thumbnailCatUrl.trim()
    else if (editing.value) payload.thumbnailCatUrl = null

    if (editing.value) await adminApi.updateCategory(editing.value.id, payload)
    else await adminApi.createCategory(payload)

    notify({ type: 'success', text: editing.value ? 'Category updated' : 'Category created' })
    formOpen.value = false
    await refresh()
  } catch {
    // BaseApiClient surfaces the error toast (e.g. duplicate)
  } finally {
    saving.value = false
  }
}

async function remove(c: any) {
  const n = c._count?.products ?? 0
  const warn = n > 0 ? ` ${n} product${n === 1 ? '' : 's'} will lose this tag.` : ''
  if (!window.confirm(`Delete "${c.name}"?${warn}`)) return
  try {
    await adminApi.deleteCategory(c.id)
    const items = (data.value as any)?.items
    if (items) (data.value as any).items = items.filter((r: any) => r.id !== c.id)
    notify({ type: 'success', text: 'Category deleted' })
  } catch {
    // toast surfaced
  }
}
</script>
