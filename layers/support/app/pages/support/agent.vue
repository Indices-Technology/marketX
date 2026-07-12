<template>
  <HomeLayout :narrow-feed="false" :hide-right-sidebar="true">
    <div class="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <!-- Not an agent -->
      <div v-if="!isAgent" class="rounded-2xl border border-gray-200 bg-white py-20 text-center dark:border-neutral-800 dark:bg-neutral-900">
        <Icon name="solar:lock-keyhole-linear" size="40" class="mb-3 text-gray-300" />
        <h2 class="text-lg font-bold text-gray-900 dark:text-neutral-100">Agents only</h2>
        <p class="mt-1 text-sm text-gray-500">This queue is for support agents.</p>
      </div>

      <template v-else>
        <div class="mb-5 flex items-center justify-between">
          <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">Support queue</h1>
          <div class="flex gap-1.5">
            <button
              v-for="f in filters"
              :key="f.value"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors"
              :class="activeFilter === f.value ? 'bg-brand text-white' : 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-300'"
              @click="setFilter(f.value)"
            >
              {{ f.label }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
          <!-- Queue list -->
          <div class="space-y-2">
            <div v-if="queuePending" class="space-y-2">
              <div v-for="i in 4" :key="i" class="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-neutral-800" />
            </div>
            <p v-else-if="!queue.length" class="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400 dark:border-neutral-800">
              Nothing here 🎉
            </p>
            <button
              v-for="t in queue"
              :key="t.id"
              class="w-full rounded-xl border p-3 text-left transition-all"
              :class="selectedId === t.id ? 'border-brand bg-brand/5' : 'border-gray-200 bg-white hover:border-brand/30 dark:border-neutral-800 dark:bg-neutral-900'"
              @click="selectTicket(t.id)"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-mono text-[10px] font-bold text-gray-400">{{ ticketRef(t.ticketNumber) }}</span>
                <div class="flex gap-1">
                  <BaseBadge :variant="priorityMeta(t.priority).variant" size="sm">{{ priorityMeta(t.priority).label }}</BaseBadge>
                  <BaseBadge :variant="statusMeta(t.status).variant" size="sm">{{ statusMeta(t.status).label }}</BaseBadge>
                </div>
              </div>
              <p class="mt-1 truncate text-sm font-semibold text-gray-900 dark:text-neutral-100">{{ t.subject }}</p>
              <p class="mt-0.5 text-[11px] text-gray-400">
                <span v-if="t.type === 'DISPUTE'" class="font-semibold text-red-500">Dispute · </span>{{ t.category }}
                <span v-if="!t.assignedAgentId"> · unassigned</span>
              </p>
            </button>
          </div>

          <!-- Detail panel -->
          <div class="rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div v-if="!selected" class="flex h-full min-h-[300px] items-center justify-center text-sm text-gray-400">
              Select a ticket to view the thread
            </div>
            <div v-else class="flex flex-col">
              <!-- Detail header -->
              <div class="flex flex-wrap items-center gap-2 border-b border-gray-200 p-4 dark:border-neutral-800">
                <div class="min-w-0 flex-1">
                  <p class="font-mono text-[10px] font-bold text-gray-400">{{ ticketRef(selected.ticketNumber) }}</p>
                  <h2 class="truncate text-base font-bold text-gray-900 dark:text-neutral-100">{{ selected.subject }}</h2>
                  <p v-if="selected.requester" class="text-[11px] text-gray-400">{{ selected.requester.username || selected.requester.email }}</p>
                </div>
                <BaseButton v-if="!selected.assignedAgentId" size="sm" variant="secondary" @click="assignToMe">Assign to me</BaseButton>
                <BaseSelect
                  :model-value="selected.status"
                  size="sm"
                  :options="statusOptions"
                  @update:model-value="changeStatus"
                />
              </div>

              <!-- Order + dispute context -->
              <div v-if="selected.order" class="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-300">
                Order #{{ selected.order.id }} · {{ selected.order.status }} · {{ selected.order.paymentStatus }} · ₦{{ (selected.order.totalAmount / 100).toLocaleString() }}
              </div>

              <!-- Thread -->
              <div class="max-h-[42vh] space-y-3 overflow-y-auto p-4">
                <div v-for="m in selected.messages" :key="m.id" class="flex" :class="m.authorRole === 'AGENT' ? 'justify-end' : 'justify-start'">
                  <div class="max-w-[80%] rounded-2xl px-3.5 py-2.5" :class="agentBubble(m)">
                    <p class="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide opacity-60">
                      {{ m.authorRole }}
                      <span v-if="m.internalNote" class="rounded bg-amber-400/30 px-1 text-amber-700">note</span>
                    </p>
                    <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ m.body }}</p>
                  </div>
                </div>
              </div>

              <!-- Agent reply -->
              <div class="border-t border-gray-200 p-4 dark:border-neutral-800">
                <BaseTextarea v-model="replyText" :rows="2" placeholder="Reply to the customer…" />
                <div class="mt-2 flex items-center justify-between">
                  <label class="flex items-center gap-1.5 text-xs text-gray-500">
                    <input v-model="internalNote" type="checkbox" class="rounded" /> Internal note
                  </label>
                  <div class="flex gap-2">
                    <BaseButton v-if="selected.status !== 'RESOLVED'" variant="secondary" size="sm" @click="openResolve">Resolve</BaseButton>
                    <BaseButton size="sm" :loading="sending" :disabled="!replyText.trim()" @click="sendReply">Send</BaseButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Resolve modal -->
    <BaseModal v-model="showResolve" title="Resolve ticket" max-width="md">
      <div class="space-y-4">
        <BaseTextarea v-model="resolveText" :rows="3" label="Resolution summary" placeholder="What did you do / decide?" />
        <div v-if="selected?.type === 'DISPUTE'">
          <p class="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-400">Dispute outcome</p>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="o in outcomes"
              :key="o.value"
              class="rounded-xl border-2 px-3 py-2 text-left text-xs font-semibold transition-all"
              :class="outcome === o.value ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 text-gray-600 dark:border-neutral-700'"
              @click="outcome = o.value"
            >
              {{ o.label }}
              <span class="mt-0.5 block text-[10px] font-normal opacity-70">{{ o.hint }}</span>
            </button>
          </div>
          <BaseInput
            v-if="outcome === 'PARTIAL_REFUND'"
            v-model="refundAmountMajor"
            class="mt-3"
            type="number"
            label="Refund amount (₦)"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <BaseButton variant="secondary" @click="showResolve = false">Cancel</BaseButton>
          <BaseButton :loading="resolving" :disabled="!resolveText.trim()" @click="submitResolve">Confirm resolution</BaseButton>
        </div>
      </template>
    </BaseModal>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAsyncData } from 'nuxt/app'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useSupport, SUPPORT_STATUS_META, SUPPORT_PRIORITY_META, ticketRef } from '~~/layers/support/app/composables/useSupport'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseSelect from '~~/layers/ui/app/components/BaseSelect.vue'
import BaseTextarea from '~~/layers/ui/app/components/BaseTextarea.vue'

definePageMeta({ middleware: 'auth' })

const support = useSupport()
const profileStore = useProfileStore()
const isAgent = computed(() => ['support_agent', 'admin'].includes((profileStore.me?.role as string) || ''))

const filters = [
  { label: 'Open', value: 'open' },
  { label: 'Unassigned', value: 'unassigned' },
  { label: 'Mine', value: 'mine' },
  { label: 'Disputes', value: 'disputes' },
  { label: 'All', value: 'all' },
]
const activeFilter = ref('open')
const queueParams = computed<Record<string, string | boolean>>(() => {
  switch (activeFilter.value) {
    case 'unassigned': return { unassigned: true }
    case 'mine': return { mine: true }
    case 'disputes': return { type: 'DISPUTE' }
    case 'open': return { status: 'ACTIVE' }
    default: return {}
  }
})

// Component → composable → apiClient (carries the auth token). Client-only:
// the access token lives client-side, so SSR would 401. `watch` re-runs the
// fetch when the active filter changes.
const {
  data: queueData,
  pending: queuePending,
  refresh: refreshQueue,
} = await useAsyncData(
  'support-agent-queue',
  () =>
    support.agent.listQueue(queueParams.value) as Promise<{
      items: QueueRow[]
    }>,
  { server: false, watch: [queueParams], default: () => ({ items: [] }) },
)
const queue = computed(() => queueData.value?.items ?? [])

interface QueueRow {
  id: string; ticketNumber: number; type: string; subject: string
  category: string; status: string; priority: string; assignedAgentId: string | null
}
interface DetailTicket extends QueueRow {
  requester?: { username: string | null; email: string } | null
  order?: { id: number; status: string; paymentStatus: string; totalAmount: number } | null
  messages: Array<{ id: string; authorRole: string; body: string; internalNote: boolean }>
}

const selectedId = ref('')
const selected = ref<DetailTicket | null>(null)
const replyText = ref('')
const internalNote = ref(false)
const sending = ref(false)

function setFilter(v: string) { activeFilter.value = v; refreshQueue() }

async function selectTicket(id: string) {
  selectedId.value = id
  const res = (await support.getTicket(id)) as { data: DetailTicket }
  selected.value = res.data
}
async function reloadSelected() {
  if (selectedId.value) await selectTicket(selectedId.value)
  await refreshQueue()
}

const statusMeta = (s: string) => SUPPORT_STATUS_META[s] ?? { label: s, variant: 'muted' }
const priorityMeta = (p: string) => SUPPORT_PRIORITY_META[p] ?? { label: p, variant: 'muted' }
const statusOptions = ['OPEN', 'IN_PROGRESS', 'PENDING_USER', 'RESOLVED', 'CLOSED'].map((s) => ({ label: statusMeta(s).label, value: s }))

function agentBubble(m: { authorRole: string; internalNote: boolean }) {
  if (m.internalNote) return 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
  if (m.authorRole === 'AGENT') return 'bg-brand text-white'
  if (m.authorRole === 'SYSTEM') return 'bg-gray-100 text-gray-500 dark:bg-neutral-800'
  return 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-100'
}

async function assignToMe() {
  await support.agent.update(selected.value!.id, { assignToMe: true })
  await reloadSelected()
}
async function changeStatus(status: string) {
  try {
    await support.agent.update(selected.value!.id, { status })
    await reloadSelected()
  } catch (e: unknown) {
    alert((e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Invalid status change')
  }
}
async function sendReply() {
  if (!replyText.value.trim()) return
  sending.value = true
  try {
    await support.agent.reply(selected.value!.id, { body: replyText.value.trim(), internalNote: internalNote.value })
    replyText.value = ''
    internalNote.value = false
    await reloadSelected()
  } finally {
    sending.value = false
  }
}

// ── Resolve ──────────────────────────────────────────────────────────────────
const showResolve = ref(false)
const resolveText = ref('')
const outcome = ref('')
const refundAmountMajor = ref('')
const resolving = ref(false)
const outcomes = [
  { label: 'Refund buyer', value: 'REFUND_BUYER', hint: 'Reverse seller credit + cancel order' },
  { label: 'Release seller', value: 'RELEASE_SELLER', hint: 'Dispute rejected, order stands' },
  { label: 'Partial refund', value: 'PARTIAL_REFUND', hint: 'Enter an amount' },
  { label: 'Reject', value: 'REJECTED', hint: 'No action' },
]
function openResolve() { showResolve.value = true; resolveText.value = ''; outcome.value = '' }
async function submitResolve() {
  resolving.value = true
  try {
    await support.agent.resolve(selected.value!.id, {
      resolution: resolveText.value.trim(),
      disputeOutcome: selected.value!.type === 'DISPUTE' ? outcome.value || undefined : undefined,
      refundAmount: outcome.value === 'PARTIAL_REFUND' ? Math.round(Number(refundAmountMajor.value) * 100) : undefined,
    })
    showResolve.value = false
    await reloadSelected()
  } catch (e: unknown) {
    alert((e as { data?: { statusMessage?: string } })?.data?.statusMessage || 'Could not resolve')
  } finally {
    resolving.value = false
  }
}
</script>
