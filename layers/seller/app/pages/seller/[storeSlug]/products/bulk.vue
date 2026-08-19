<template>
  <div class="px-3 py-4 sm:px-6">
    <!-- Header -->
    <div class="mb-6 flex items-center gap-3">
      <NuxtLink
        :to="`/seller/${storeSlug}/products`"
        class="text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        <Icon name="solar:arrow-left-linear" size="20" />
      </NuxtLink>
      <div>
        <h1
          class="font-display text-2xl font-bold text-gray-900 dark:text-neutral-100"
        >
          Bulk import
        </h1>
        <p class="text-sm text-gray-400 dark:text-neutral-500">
          Add many products at once — they arrive as drafts for you to review.
        </p>
      </div>
    </div>

    <!-- ── Import sources: phone is the hero, socials come later ─────────────── -->
    <div class="max-w-3xl">
      <p class="mb-1 text-xs font-bold uppercase tracking-widest text-brand">
        On your device
      </p>
      <button
        type="button"
        class="flex w-full items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 p-5 text-left transition-colors hover:border-brand hover:bg-brand/5 dark:border-neutral-700 dark:hover:border-brand dark:hover:bg-brand/10"
        @click="pickFiles"
      >
        <div
          class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"
        >
          <Icon name="solar:gallery-add-bold" size="26" />
        </div>
        <div class="min-w-0">
          <p class="font-display font-bold text-gray-900 dark:text-white">
            Add photos from your phone
          </p>
          <p class="text-sm text-gray-500 dark:text-neutral-400">
            Instant · free · pick as many as you like
          </p>
        </div>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        multiple
        class="hidden"
        @change="onFilesPicked"
      />

      <p
        ref="socialSources"
        class="mb-1 mt-6 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-neutral-500"
      >
        From your socials
      </p>
      <ul
        class="divide-y divide-gray-100 rounded-2xl border border-gray-100 dark:divide-neutral-800 dark:border-neutral-800"
      >
        <li
          v-for="s in comingSoonSources"
          :key="s.id"
          class="flex items-center justify-between px-4 py-3"
        >
          <span
            class="flex items-center gap-2.5 text-sm font-medium text-gray-500 dark:text-neutral-400"
          >
            <Icon :name="s.icon" size="18" />
            {{ s.name }}
          </span>
          <span class="text-xs font-medium text-gray-400 dark:text-neutral-600">
            Coming soon
          </span>
        </li>
        <li class="flex items-center justify-between px-4 py-3">
          <!-- Connected: this page only ever USES the connection, never manages
               it — connecting/switching Pages happens on Growth → Connected
               accounts (single source of truth), not duplicated here. -->
          <button
            v-if="fbConnection"
            type="button"
            class="flex flex-1 items-center justify-between text-left"
            @click="onFacebookClick"
          >
            <span
              class="flex items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-neutral-300"
            >
              <Icon name="mdi:facebook" size="18" />
              Facebook
              <span
                class="truncate text-xs font-normal text-gray-400 dark:text-neutral-500"
              >
                ({{ fbConnection.displayName || 'connected' }})
              </span>
            </span>
            <span
              class="flex items-center gap-1 text-xs font-semibold text-mint"
            >
              Import from your posts
              <Icon name="solar:alt-arrow-right-linear" size="14" />
            </span>
          </button>
          <NuxtLink
            v-else
            :to="`/seller/${storeSlug}/growth`"
            class="flex flex-1 items-center justify-between text-left"
          >
            <span
              class="flex items-center gap-2.5 text-sm font-medium text-gray-700 dark:text-neutral-300"
            >
              <Icon name="mdi:facebook" size="18" />
              Facebook
            </span>
            <span
              class="flex items-center gap-1 text-xs font-semibold text-brand"
            >
              Connect in Growth
              <Icon name="solar:alt-arrow-right-linear" size="14" />
            </span>
          </NuxtLink>
          <button
            v-if="fbConnection"
            type="button"
            class="ml-3 shrink-0 text-xs font-medium text-gray-400 hover:text-brand disabled:opacity-50 dark:text-neutral-500"
            :disabled="disconnectingFb"
            @click="onDisconnectFacebook"
          >
            Disconnect
          </button>
        </li>
      </ul>
    </div>

    <!-- Facebook post picker -->
    <BaseModal
      v-if="showFbPostPicker"
      :model-value="true"
      title="Import from Facebook"
      @update:model-value="(v) => !v && (showFbPostPicker = false)"
    >
      <div v-if="fbPosts.loading.value" class="flex justify-center py-10">
        <Icon name="svg-spinners:ring-resize" size="24" class="text-gray-400" />
      </div>
      <p
        v-else-if="fbPosts.error.value"
        class="py-6 text-center text-sm text-brand"
      >
        {{ fbPosts.error.value }}
      </p>
      <p
        v-else-if="fbPosts.posts.value.length === 0"
        class="py-6 text-center text-sm text-gray-400 dark:text-neutral-500"
      >
        No photo posts found on your Page yet.
      </p>
      <ul v-else class="space-y-2">
        <li
          v-for="post in fbPosts.posts.value"
          :key="post.id"
          class="flex items-center gap-3 rounded-xl border border-gray-100 p-2.5 dark:border-neutral-800"
        >
          <div
            class="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800"
          >
            <img
              :src="post.images[0]"
              alt=""
              class="h-full w-full object-cover"
            />
            <span
              v-if="post.images.length > 1"
              class="absolute bottom-0 right-0 rounded-tl-md bg-black/70 px-1 text-[10px] font-semibold text-white"
            >
              {{ post.images.length }}
            </span>
          </div>
          <p
            class="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-neutral-300"
          >
            {{ post.message || 'No caption' }}
          </p>
          <BaseButton
            variant="secondary"
            size="sm"
            :disabled="addedFbPostIds.has(post.id)"
            @click="onImportFbPost(post)"
          >
            <Icon
              v-if="addedFbPostIds.has(post.id)"
              name="solar:check-circle-bold"
              size="16"
            />
            <template v-else>Add</template>
          </BaseButton>
        </li>
      </ul>
    </BaseModal>

    <!-- ── Review grid ───────────────────────────────────────────────────────── -->
    <div v-if="rows.length" class="mt-8">
      <div class="mb-3 flex items-center justify-between">
        <h2
          class="font-display text-xl font-bold text-gray-900 dark:text-white"
        >
          {{ rows.length }}
          {{ rows.length === 1 ? 'product' : 'products' }} staged
        </h2>
        <div class="flex items-center gap-2">
          <BaseButton
            v-if="selected.size >= 2"
            variant="secondary"
            size="sm"
            @click="combineSelected"
          >
            <Icon name="solar:layers-minimalistic-bold" size="16" />
            Combine {{ selected.size }} into one
          </BaseButton>
          <BaseButton
            v-if="needAiCount > 0"
            variant="secondary"
            size="sm"
            :loading="aiGeneratingCount > 0"
            @click="generateAll"
          >
            <Icon name="solar:magic-stick-3-bold" size="16" />
            Generate {{ needAiCount }} with AI
          </BaseButton>
        </div>
      </div>

      <ul class="space-y-2">
        <li
          v-for="row in rows"
          :key="row.localId"
          class="flex flex-col gap-2 rounded-xl border p-2.5"
          :class="[
            row.status === 'error'
              ? 'border-brand/40 bg-brand/5'
              : selected.has(row.localId)
                ? 'border-brand bg-brand/5 dark:bg-brand/10'
                : 'border-gray-100 dark:border-neutral-800',
          ]"
        >
          <div class="flex items-center gap-3">
            <!-- select for combine -->
            <input
              type="checkbox"
              class="h-4 w-4 shrink-0 accent-brand"
              :checked="selected.has(row.localId)"
              :disabled="row.status !== 'ready'"
              @change="toggleSelect(row.localId)"
            />

            <!-- preview (first image) with a count badge for multi-image rows -->
            <div
              class="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-neutral-800"
            >
              <img
                :src="row.previews[0]"
                alt=""
                class="h-full w-full object-cover"
              />
              <span
                v-if="row.media.length > 1 || row.previews.length > 1"
                class="absolute bottom-0 right-0 rounded-tl-md bg-black/70 px-1 text-[10px] font-semibold text-white"
              >
                {{ Math.max(row.media.length, row.previews.length) }}
              </span>
              <div
                v-if="row.status === 'uploading'"
                class="absolute inset-0 flex items-center justify-center bg-black/40"
              >
                <Icon
                  name="svg-spinners:ring-resize"
                  size="20"
                  class="text-white"
                />
              </div>
            </div>

            <!-- title + price -->
            <div
              class="flex min-w-0 flex-1 flex-col gap-1.5 sm:flex-row sm:items-center"
            >
              <div class="flex w-full flex-col gap-0.5">
                <input
                  :value="row.title"
                  type="text"
                  placeholder="Name this product"
                  class="w-full rounded-lg border bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none dark:bg-neutral-900 dark:text-neutral-100"
                  :class="
                    needsName(row)
                      ? 'border-brand focus:border-brand'
                      : 'border-gray-200 focus:border-brand dark:border-neutral-700'
                  "
                  @input="
                    updateRow(row.localId, {
                      title: ($event.target as HTMLInputElement).value,
                    })
                  "
                />
                <!-- Tell the seller exactly what's missing — never a silent block. -->
                <span
                  v-if="row.status === 'ready' && rowIssue(row)"
                  class="text-[11px] font-medium text-brand"
                >
                  {{ rowIssue(row) }}
                </span>
              </div>
              <div class="relative sm:w-32">
                <span
                  class="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400"
                  >₦</span
                >
                <input
                  :value="row.price ?? ''"
                  type="number"
                  min="0"
                  placeholder="Price"
                  class="w-full rounded-lg border bg-white py-1.5 pl-6 pr-2.5 text-sm text-gray-900 focus:outline-none dark:bg-neutral-900 dark:text-neutral-100"
                  :class="
                    needsPrice(row)
                      ? 'border-brand focus:border-brand'
                      : 'border-gray-200 focus:border-brand dark:border-neutral-700'
                  "
                  @input="
                    updateRow(row.localId, {
                      price: numOrNull(
                        ($event.target as HTMLInputElement).value,
                      ),
                    })
                  "
                />
              </div>
            </div>

            <!-- AI draft / status / remove -->
            <div class="flex shrink-0 items-center gap-1">
              <span
                v-if="row.status === 'error'"
                class="max-w-[8rem] truncate text-xs text-brand"
                :title="row.error"
              >
                {{ row.error || 'Failed' }}
              </span>
              <!-- Per-row AI draft (one paid vision call). -->
              <button
                v-if="row.status === 'ready'"
                type="button"
                class="rounded-lg p-1.5 transition-colors"
                :class="
                  row.aiStatus === 'done'
                    ? 'text-brand'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-brand dark:hover:bg-neutral-800'
                "
                :disabled="row.aiStatus === 'generating'"
                :aria-label="
                  row.aiStatus === 'done'
                    ? 'Regenerate with AI'
                    : 'Draft with AI'
                "
                :title="
                  row.aiStatus === 'done'
                    ? 'Regenerate with AI'
                    : 'Draft name & description with AI'
                "
                @click="generateForRow(row.localId)"
              >
                <Icon
                  v-if="row.aiStatus === 'generating'"
                  name="svg-spinners:ring-resize"
                  size="18"
                />
                <Icon v-else name="solar:magic-stick-3-bold" size="18" />
              </button>
              <button
                type="button"
                class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand dark:hover:bg-neutral-800"
                aria-label="Remove"
                @click="removeRow(row.localId)"
              >
                <Icon name="solar:trash-bin-trash-linear" size="18" />
              </button>
            </div>
          </div>

          <!-- Description: collapsed toggle; opens automatically when AI fills it -->
          <div v-if="row.status === 'ready'" class="pl-7">
            <button
              type="button"
              class="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand dark:text-neutral-400"
              @click="toggleDesc(row.localId)"
            >
              <Icon
                :name="
                  expanded.has(row.localId) || row.description
                    ? 'solar:alt-arrow-down-linear'
                    : 'solar:alt-arrow-right-linear'
                "
                size="14"
              />
              Description
              <Icon
                v-if="row.aiStatus === 'done' && row.description"
                name="solar:magic-stick-3-bold"
                size="12"
                class="text-brand"
              />
            </button>
            <textarea
              v-if="expanded.has(row.localId) || row.description"
              :value="row.description"
              rows="3"
              placeholder="Describe this product (optional)…"
              class="mt-1 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-brand focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              @input="
                updateRow(row.localId, {
                  description: ($event.target as HTMLTextAreaElement).value,
                })
              "
            />
          </div>
        </li>
      </ul>
    </div>

    <!-- ── Sticky commit bar ─────────────────────────────────────────────────── -->
    <div
      v-if="rows.length"
      class="sticky bottom-0 mt-6 flex items-center justify-between gap-3 border-t border-gray-100 bg-white/90 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-900/90"
    >
      <p class="text-sm text-gray-500 dark:text-neutral-400">
        <span v-if="uploadingCount">Uploading {{ uploadingCount }}…</span>
        <span v-else-if="validRows.length"
          >{{ validRows.length }} ready to import as drafts</span
        >
        <span v-else-if="rows.length" class="text-brand">
          Add a name (2+ characters) and price to each product
        </span>
      </p>
      <BaseButton
        variant="primary"
        :loading="isCommitting"
        :disabled="!canCommit || validRows.length === 0"
        @click="doCommit"
      >
        Import {{ validRows.length }}
        {{ validRows.length === 1 ? 'product' : 'products' }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { notify } from '@kyvg/vue3-notification'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import {
  useBulkImport,
  rowIssue,
  type StagedRow,
} from '~~/layers/seller/app/composables/useBulkImport'
import { useConnections } from '~~/layers/growth/app/composables/useConnections'
import { useFacebookImport } from '~~/layers/growth/app/composables/useFacebookImport'
import type { FacebookImportPost } from '~~/layers/growth/app/services/facebookImport.api'

definePageMeta({ middleware: 'auth', layout: 'store-layout' })

const route = useRoute()
const router = useRouter()
const storeSlug = computed(() => route.params.storeSlug as string)

const {
  rows,
  isCommitting,
  uploadingCount,
  validRows,
  canCommit,
  aiGeneratingCount,
  addFiles,
  addFromFacebookPost,
  removeRow,
  combineRows,
  updateRow,
  generateForRow,
  generateAll,
  commit,
} = useBulkImport(storeSlug.value)

// Rows still missing a name — the cost-aware target for "Generate all".
const needAiCount = computed(
  () =>
    rows.value.filter((r) => r.status === 'ready' && !r.title.trim()).length,
)
// Which rows have their description panel expanded.
const expanded = ref<Set<string>>(new Set())
function toggleDesc(id: string) {
  const next = new Set(expanded.value)
  next.has(id) ? next.delete(id) : next.add(id)
  expanded.value = next
}

const fileInput = ref<HTMLInputElement | null>(null)
const selected = ref<Set<string>>(new Set())

const comingSoonSources = [
  { id: 'ig', name: 'Instagram', icon: 'mdi:instagram' },
  { id: 'tt', name: 'TikTok', icon: 'ic:baseline-tiktok' },
]

// ── Facebook: import from Page posts (connecting happens on Growth →
// Connected accounts — this page only consumes an existing connection) ──────
const {
  connections,
  refresh: refreshConnections,
  forPlatform,
  disconnect,
} = useConnections()
const fbConnection = computed(() => {
  void connections // stay reactive to the connections list
  return forPlatform('META_FB')
})

const disconnectingFb = ref(false)
const showFbPostPicker = ref(false)
const addedFbPostIds = ref<Set<string>>(new Set())
const fbPosts = useFacebookImport()

function onFacebookClick() {
  showFbPostPicker.value = true
  fbPosts.load()
}

async function onDisconnectFacebook() {
  if (!fbConnection.value) return
  disconnectingFb.value = true
  try {
    await disconnect(fbConnection.value.id)
    notify({ type: 'success', text: 'Facebook disconnected' })
  } catch {
    notify({ type: 'error', text: "Couldn't disconnect. Try again." })
  } finally {
    disconnectingFb.value = false
  }
}

function onImportFbPost(post: FacebookImportPost) {
  addedFbPostIds.value = new Set(addedFbPostIds.value).add(post.id)
  addFromFacebookPost(post)
}

// Deep link from the seller-registration success screen ("Import from
// Facebook"). Connections load first, so a seller who already linked a Page
// lands straight in the post picker; one who hasn't gets the section — and its
// "Connect in Growth" row — scrolled into view instead of a dead end.
const socialSources = ref<HTMLElement | null>(null)

onMounted(async () => {
  await refreshConnections()
  if (route.query.source !== 'facebook') return

  if (fbConnection.value) onFacebookClick()
  else
    socialSources.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  // Drop the query so a refresh (or a back-navigation) doesn't reopen it.
  router.replace({ query: { ...route.query, source: undefined } })
})

function pickFiles() {
  fileInput.value?.click()
}

function onFilesPicked(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) addFiles(input.files)
  input.value = '' // allow re-picking the same files
}

function numOrNull(v: string): number | null {
  const n = Number(v)
  return v === '' || Number.isNaN(n) ? null : n
}

// Per-field validity for inline highlighting (only once the upload is done).
function needsName(row: StagedRow): boolean {
  return row.status === 'ready' && row.title.trim().length < 2
}
function needsPrice(row: StagedRow): boolean {
  return (
    row.status === 'ready' && (typeof row.price !== 'number' || row.price <= 0)
  )
}

function toggleSelect(id: string) {
  const next = new Set(selected.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selected.value = next
}

function combineSelected() {
  combineRows([...selected.value])
  selected.value = new Set()
}

async function doCommit() {
  const summary = await commit()
  if (!summary) return
  if (summary.failed > 0) {
    notify({
      type: 'warning',
      text: `${summary.created} imported as drafts · ${summary.failed} need attention`,
    })
  } else {
    notify({
      type: 'success',
      text: `${summary.created} products imported as drafts`,
    })
    if (rows.value.length === 0) {
      router.push(`/seller/${storeSlug.value}/products?status=DRAFT`)
    }
  }
}
</script>
