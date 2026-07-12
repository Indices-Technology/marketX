<template>
  <HomeLayout :narrow-feed="true" :hide-right-sidebar="true">
    <div class="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div
            class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand"
          >
            <Icon name="mdi:lifebuoy" size="22" />
          </div>
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-neutral-100">
              Support
            </h1>
            <p class="text-xs text-gray-400 dark:text-neutral-500">
              Your tickets &amp; disputes
            </p>
          </div>
        </div>
        <BaseButton size="sm" @click="showNew = true">
          <Icon name="solar:add-circle-linear" size="18" /> New ticket
        </BaseButton>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="space-y-3">
        <div
          v-for="i in 3"
          :key="i"
          class="h-24 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        />
      </div>

      <!-- Empty -->
      <div
        v-else-if="!tickets.length"
        class="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-neutral-800 dark:bg-neutral-900"
      >
        <Icon
          name="solar:chat-line-linear"
          size="40"
          class="mb-3 text-gray-300 dark:text-neutral-600"
        />
        <h3 class="text-base font-bold text-gray-900 dark:text-neutral-100">
          No tickets yet
        </h3>
        <p
          class="mx-auto mt-1 max-w-xs text-sm text-gray-500 dark:text-neutral-400"
        >
          Have a question or a problem with an order? Open a ticket and our team
          will help.
        </p>
        <BaseButton class="mt-4" size="sm" @click="showNew = true"
          >Contact support</BaseButton
        >
      </div>

      <!-- List -->
      <div v-else class="space-y-3">
        <NuxtLink
          v-for="t in tickets"
          :key="t.id"
          :to="`/support/${t.id}`"
          class="block rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-brand/30 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] font-bold text-gray-400">{{
                  ticketRef(t.ticketNumber)
                }}</span>
                <BaseBadge
                  v-if="t.type === 'DISPUTE'"
                  variant="danger"
                  size="sm"
                  >Dispute</BaseBadge
                >
              </div>
              <h3
                class="mt-0.5 truncate text-[15px] font-semibold text-gray-900 dark:text-neutral-100"
              >
                {{ t.subject }}
              </h3>
              <p class="mt-0.5 text-xs text-gray-400 dark:text-neutral-500">
                {{ t.category }} · updated
                {{ timeAgo(t.lastMessageAt || t.created_at) }}
              </p>
            </div>
            <BaseBadge :variant="statusMeta(t.status).variant" size="sm">
              {{ statusMeta(t.status).label }}
            </BaseBadge>
          </div>
        </NuxtLink>
      </div>
    </div>

    <!-- New ticket modal -->
    <SupportNewTicketModal v-model="showNew" @created="onCreated" />
  </HomeLayout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAsyncData } from 'nuxt/app'
import { definePageMeta } from '#imports'
import HomeLayout from '~~/layers/feed/app/layouts/HomeLayout.vue'
import SupportNewTicketModal from '~~/layers/support/app/components/SupportNewTicketModal.vue'
import {
  useSupport,
  SUPPORT_STATUS_META,
  ticketRef,
} from '~~/layers/support/app/composables/useSupport'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'

definePageMeta({ middleware: 'auth' })

interface TicketRow {
  id: string
  ticketNumber: number
  type: string
  subject: string
  category: string
  status: string
  created_at: string
  lastMessageAt: string | null
}

const showNew = ref(false)
const support = useSupport()

// Component → composable → apiClient (carries the auth token). Client-only:
// the access token lives client-side, so SSR would 401.
const { data, pending, refresh } = await useAsyncData(
  'support-my-tickets',
  () => support.listMyTickets() as Promise<{ items: TicketRow[] }>,
  { server: false, default: () => ({ items: [] }) },
)
const tickets = computed(() => data.value?.items ?? [])

const statusMeta = (s: string) =>
  SUPPORT_STATUS_META[s] ?? { label: s, variant: 'muted' }

function onCreated(id: string) {
  showNew.value = false
  if (id) navigateTo(`/support/${id}`)
  else refresh()
}

function timeAgo(d: string | null): string {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
</script>
