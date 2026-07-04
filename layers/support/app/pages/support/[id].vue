<template>
  <HomeLayout :narrow-feed="true" :hide-right-sidebar="true">
    <div class="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <!-- Header -->
      <div class="mb-5 flex items-center gap-3">
        <NuxtLink to="/support" class="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-neutral-800">
          <Icon name="mdi:arrow-left" size="22" />
        </NuxtLink>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-mono text-[11px] font-bold text-gray-400">{{ ticketRef(ticket?.ticketNumber || 0) }}</span>
            <BaseBadge v-if="ticket?.type === 'DISPUTE'" variant="danger" size="sm">Dispute</BaseBadge>
            <BaseBadge v-if="ticket" :variant="statusMeta.variant" size="sm">{{ statusMeta.label }}</BaseBadge>
          </div>
          <h1 class="truncate text-lg font-bold text-gray-900 dark:text-neutral-100">
            {{ ticket?.subject || 'Ticket' }}
          </h1>
        </div>
        <BaseButton
          v-if="ticket && ticket.status !== 'CLOSED'"
          variant="ghost"
          size="sm"
          @click="close"
        >
          Close
        </BaseButton>
      </div>

      <!-- Context: order link -->
      <NuxtLink
        v-if="ticket?.order"
        :to="`/buyer/orders/${ticket.order.id}`"
        class="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-neutral-800 dark:bg-neutral-800/50 dark:text-neutral-300"
      >
        <Icon name="mdi:package-variant-closed" size="16" />
        Order #{{ ticket.order.id }} · {{ ticket.order.status }}
        <Icon name="mdi:chevron-right" size="16" class="ml-auto" />
      </NuxtLink>

      <!-- Thread -->
      <div v-if="pending" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-16 animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800" />
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="m in messages"
          :key="m.id"
          class="flex"
          :class="isMine(m) ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-[80%] rounded-2xl px-3.5 py-2.5"
            :class="bubbleClass(m)"
          >
            <p class="mb-0.5 text-[10px] font-bold uppercase tracking-wide opacity-60">
              {{ roleLabel(m) }}
            </p>
            <p class="whitespace-pre-wrap text-sm leading-relaxed">{{ m.body }}</p>
            <p class="mt-1 text-[10px] opacity-50">{{ formatTime(m.created_at) }}</p>
          </div>
        </div>
      </div>

      <!-- Reply box -->
      <div v-if="ticket && ticket.status !== 'CLOSED'" class="mt-5">
        <BaseTextarea v-model="replyText" :rows="3" placeholder="Type your reply…" />
        <div class="mt-2 flex justify-end">
          <BaseButton :loading="sending" :disabled="!replyText.trim()" @click="send">Send reply</BaseButton>
        </div>
      </div>
      <div
        v-else-if="ticket"
        class="mt-5 rounded-xl border border-gray-200 bg-gray-50 py-4 text-center text-sm text-gray-500 dark:border-neutral-800 dark:bg-neutral-800/40 dark:text-neutral-400"
      >
        This ticket is closed.
      </div>
    </div>
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAsyncData } from 'nuxt/app'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useSupport, SUPPORT_STATUS_META, ticketRef } from '~~/layers/support/app/composables/useSupport'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseTextarea from '~~/layers/ui/app/components/BaseTextarea.vue'

definePageMeta({ middleware: 'auth' })

interface Message {
  id: string
  authorId: string | null
  authorRole: string
  body: string
  created_at: string
}
interface Ticket {
  id: string
  ticketNumber: number
  type: string
  subject: string
  status: string
  order?: { id: number; status: string } | null
  messages: Message[]
}

const route = useRoute()
const support = useSupport()
const profileStore = useProfileStore()

// Component → composable → apiClient (carries the auth token). Client-only:
// the access token lives client-side, so SSR would 401.
const { data, pending, refresh } = await useAsyncData<{ data: Ticket | null }>(
  `support-ticket-${route.params.id}`,
  () =>
    support.getTicket(route.params.id as string) as Promise<{
      data: Ticket | null
    }>,
  { server: false, default: () => ({ data: null }) },
)
const ticket = computed(() => data.value?.data ?? null)
const messages = computed(() => ticket.value?.messages ?? [])
const statusMeta = computed(
  () => SUPPORT_STATUS_META[ticket.value?.status || ''] ?? { label: '', variant: 'muted' },
)

const replyText = ref('')
const sending = ref(false)

const isMine = (m: Message) => !!m.authorId && m.authorId === profileStore.userId
const roleLabel = (m: Message) =>
  m.authorRole === 'AGENT' ? 'Support' : m.authorRole === 'SYSTEM' ? 'System' : m.authorRole === 'SELLER' ? 'Seller' : 'You'

function bubbleClass(m: Message) {
  if (m.authorRole === 'SYSTEM') return 'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
  if (m.authorRole === 'AGENT') return 'bg-brand/10 text-gray-800 dark:bg-brand/15 dark:text-neutral-100'
  return isMine(m)
    ? 'bg-brand text-white'
    : 'bg-gray-100 text-gray-800 dark:bg-neutral-800 dark:text-neutral-100'
}

async function send() {
  if (!replyText.value.trim()) return
  sending.value = true
  try {
    await support.reply(ticket.value!.id, replyText.value.trim())
    replyText.value = ''
    await refresh()
  } finally {
    sending.value = false
  }
}

async function close() {
  await support.closeTicket(ticket.value!.id)
  await refresh()
}

function formatTime(d: string): string {
  return new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
