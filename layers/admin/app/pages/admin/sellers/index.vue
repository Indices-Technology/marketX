<template>
  <div class="mx-auto max-w-5xl space-y-6 p-6">
    <div>
      <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
        Sellers
      </h1>
      <p class="mt-0.5 text-[13px] text-gray-400 dark:text-neutral-500">
        Manage stores and verifications
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="f in FILTERS"
        :key="f.value"
        :class="[
          'rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors',
          statusFilter === f.value
            ? 'bg-gray-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
            : 'border border-gray-200 bg-white text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400',
        ]"
        @click=" statusFilter = f.value; offset = 0"
      >
        {{ f.label }}
      </button>

      <div class="relative ml-auto">
        <Icon
          name="mdi:magnify"
          size="15"
          class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          v-model="search"
          placeholder="Search store…"
          class="rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-[12px] focus:outline-none focus:ring-2 focus:ring-rose-400 dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>
    </div>

    <div
      class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
    >
      <table v-if="pending && !data" class="w-full text-[13px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr
            class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500"
          >
            <th class="px-4 py-3">Store</th>
            <th class="px-4 py-3">Owner</th>
            <th class="px-4 py-3">Products</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Verification</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr v-for="i in 8" :key="i" class="animate-pulse">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <div
                  class="h-8 w-8 rounded-lg bg-gray-100 dark:bg-neutral-800"
                />
                <div class="space-y-1.5">
                  <div
                    class="h-3 w-28 rounded bg-gray-100 dark:bg-neutral-800"
                  />
                  <div
                    class="h-2.5 w-20 rounded bg-gray-100 dark:bg-neutral-800"
                  />
                </div>
              </div>
            </td>
            <td class="px-4 py-3">
              <div class="h-3 w-24 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3">
              <div class="h-3 w-8 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3">
              <div class="h-4 w-14 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3">
              <div class="h-4 w-16 rounded bg-gray-100 dark:bg-neutral-800" />
            </td>
            <td class="px-4 py-3" />
          </tr>
        </tbody>
      </table>
      <div
        v-else-if="!sellers.length"
        class="p-8 text-center text-[13px] text-gray-400"
      >
        No sellers found
      </div>
      <table v-else class="w-full text-[13px]">
        <thead class="bg-gray-50 dark:bg-neutral-800/50">
          <tr
            class="text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-neutral-500"
          >
            <th class="px-4 py-3">Store</th>
            <th class="px-4 py-3">Owner</th>
            <th class="px-4 py-3">Products</th>
            <th class="px-4 py-3">Status</th>
            <th class="px-4 py-3">Verification</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50 dark:divide-neutral-800">
          <tr
            v-for="seller in sellers"
            :key="seller.id"
            class="transition-colors hover:bg-gray-50/50 dark:hover:bg-neutral-800/30"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2.5">
                <img
                  v-if="seller.store_logo"
                  :src="seller.store_logo"
                  class="h-8 w-8 rounded-lg object-cover"
                />
                <div
                  v-else
                  class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800"
                >
                  <Icon
                    name="mdi:store-outline"
                    size="15"
                    class="text-gray-400"
                  />
                </div>
                <div>
                  <p class="font-medium text-gray-800 dark:text-neutral-200">
                    {{ seller.store_name || seller.store_slug }}
                  </p>
                  <p class="text-[11px] text-gray-400 dark:text-neutral-600">
                    {{ seller.store_slug }}
                  </p>
                </div>
              </div>
            </td>
            <td class="px-4 py-3 text-gray-500 dark:text-neutral-400">
              {{ seller.profile?.username || seller.profile?.email }}
            </td>
            <td class="px-4 py-3 font-mono text-gray-700 dark:text-neutral-300">
              {{ seller._count?.products ?? 0 }}
            </td>
            <td class="px-4 py-3">
              <span
                :class="
                  seller.is_active
                    ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-neutral-800'
                "
                class="rounded px-2 py-0.5 text-[10px] font-semibold"
              >
                {{ seller.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span
                :class="verificationClass(seller.verification_status)"
                class="rounded px-2 py-0.5 text-[10px] font-semibold"
              >
                {{ seller.verification_status }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1.5">
                <button
                  class="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  @click="openDocs(seller)"
                >
                  <Icon name="mdi:file-document-outline" size="13" /> Docs
                </button>
                <template v-if="seller.verification_status === 'PENDING'">
                  <button
                    class="rounded-lg bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-600 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400"
                    @click="verify(seller.id, 'VERIFIED')"
                  >
                    Approve
                  </button>
                  <button
                    class="rounded-lg bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
                    @click="verify(seller.id, 'REJECTED')"
                  >
                    Reject
                  </button>
                </template>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="hasMore || offset > 0" class="flex justify-between">
      <button
        :disabled="offset === 0"
        class="rounded-lg border border-gray-200 px-4 py-2 text-[13px] disabled:opacity-40 dark:border-neutral-700"
        @click="offset = Math.max(0, offset - LIMIT)"
      >
        Previous
      </button>
      <button
        :disabled="!hasMore"
        class="rounded-lg border border-gray-200 px-4 py-2 text-[13px] disabled:opacity-40 dark:border-neutral-700"
        @click="offset += LIMIT"
      >
        Next
      </button>
    </div>

    <!-- Verification documents viewer -->
    <BaseModal
      :model-value="docsOpen"
      :title="`Documents · ${docsSeller?.store_name || ''}`"
      max-width="lg"
      @update:model-value="(v) => !v && (docsOpen = false)"
    >
      <div v-if="docsLoading" class="flex justify-center py-10">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>

      <div
        v-else-if="!docs.length"
        class="flex flex-col items-center justify-center py-12 text-center text-gray-400 dark:text-neutral-500"
      >
        <Icon name="mdi:file-remove-outline" size="30" class="mb-2 opacity-40" />
        <p class="text-[13px]">This seller hasn't uploaded any verification documents.</p>
      </div>

      <div v-else class="grid grid-cols-2 gap-3">
        <div
          v-for="d in docs"
          :key="d.id"
          class="overflow-hidden rounded-xl border border-gray-200 dark:border-neutral-700"
        >
          <a :href="d.url" target="_blank" rel="noopener noreferrer" class="block">
            <img
              v-if="isImage(d.url)"
              :src="d.url"
              class="h-40 w-full bg-gray-50 object-contain dark:bg-neutral-800"
              alt=""
            />
            <div
              v-else
              class="flex h-40 w-full flex-col items-center justify-center gap-1 bg-gray-50 text-gray-400 dark:bg-neutral-800"
            >
              <Icon name="mdi:file-document-outline" size="30" />
              <span class="text-[11px]">Open document</span>
            </div>
          </a>
          <div class="flex items-center justify-between px-3 py-2">
            <span class="text-[12px] font-medium capitalize text-gray-700 dark:text-neutral-300">
              {{ (d.type || 'document').replace(/_/g, ' ').toLowerCase() }}
            </span>
            <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="verificationClass(d.status)">
              {{ d.status }}
            </span>
          </div>
        </div>
      </div>

      <template v-if="docsSeller?.verification_status === 'PENDING'" #footer>
        <div class="flex gap-3">
          <BaseButton
            variant="danger"
            class="flex-1"
            @click="verifyFromDocs('REJECTED')"
          >
            Reject
          </BaseButton>
          <BaseButton
            variant="primary"
            class="flex-1"
            @click="verifyFromDocs('VERIFIED')"
          >
            Approve seller
          </BaseButton>
        </div>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from 'nuxt/app'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'

definePageMeta({ middleware: 'admin', layout: 'admin-layout' })

const LIMIT = 20
const FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending Verification' },
  { value: 'inactive', label: 'Inactive' },
]

const search = ref('')
const route = useRoute()
// Seed from the URL so the dashboard's "?status=pending" link works.
const statusFilter = ref((route.query.status as string) || '')
const offset = ref(0)

const adminApi = useAdminApi()
// Debounce search so we don't fire a request on every keystroke.
const debouncedSearch = useDebounce(search, 300)
const { data, pending } = useAsyncData(
  'admin-sellers',
  () =>
    adminApi.getSellers({
      search: debouncedSearch.value || undefined,
      status: statusFilter.value || undefined,
      limit: LIMIT,
      offset: offset.value,
    }),
  { lazy: true, watch: [debouncedSearch, statusFilter, offset] },
)

const sellers = computed(() => (data.value as any)?.items ?? [])
const hasMore = computed(() => (data.value as any)?.meta?.hasMore ?? false)

watch([debouncedSearch, statusFilter], () => {
  offset.value = 0
})

async function verify(id: string, status: 'VERIFIED' | 'REJECTED') {
  try {
    await adminApi.verifySeller(id, status)
    // Patch the row in place instead of refetching the whole list.
    const row = (data.value as any)?.items?.find((s: any) => s.id === id)
    if (row)
      Object.assign(row, {
        verification_status: status,
        is_verified: status === 'VERIFIED',
      })
  } catch {}
}

// ── Verification documents viewer ────────────────────────────────────────────
const docsOpen = ref(false)
const docsSeller = ref<any>(null)
const docs = ref<any[]>([])
const docsLoading = ref(false)

async function openDocs(seller: any) {
  docsSeller.value = seller
  docs.value = []
  docsOpen.value = true
  docsLoading.value = true
  try {
    const res: any = await adminApi.getSellerDocuments(seller.id)
    docs.value = res?.items ?? []
  } catch {
    docs.value = []
  } finally {
    docsLoading.value = false
  }
}

async function verifyFromDocs(status: 'VERIFIED' | 'REJECTED') {
  if (!docsSeller.value) return
  await verify(docsSeller.value.id, status)
  docsOpen.value = false
}

function isImage(url: string) {
  return /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url || '')
}

function useDebounce<T>(value: Ref<T>, delay: number) {
  const debounced = ref(value.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout>
  watch(value, (v) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = v
    }, delay)
  })
  return debounced
}

function verificationClass(status: string) {
  const map: Record<string, string> = {
    PENDING:
      'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    VERIFIED:
      'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    REJECTED: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  }
  return map[status] ?? ''
}
</script>
