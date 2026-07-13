<template>
  <ClientOnly>
    <!-- ── Floating trigger button ────────────────────────────────────────── -->
    <button
      v-if="!isOpen"
      class="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 active:scale-95 md:hidden"
      :class="[
        bannerVisible ? 'bottom-36' : 'bottom-20',
        unreadMessages > 0
          ? 'bg-brand text-white'
          : 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900',
      ]"
      aria-label="Messages & AI"
      @click="open"
    >
      <!-- Badge for unread messages -->
      <span
        v-if="unreadMessages > 0"
        class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
      >
        {{ unreadMessages > 9 ? '9+' : unreadMessages }}
      </span>
      <Icon name="solar:chat-line-bold" size="28" />
    </button>

    <!-- ── Full-screen bottom sheet ───────────────────────────────────────── -->
    <Teleport to="body">
      <Transition name="sheet">
        <div
          v-if="isOpen"
          class="fixed inset-0 z-50 flex flex-col bg-white md:hidden dark:bg-neutral-950"
        >
          <!-- Header with tabs -->
          <div
            class="shrink-0 border-b border-gray-200 dark:border-neutral-800"
          >
            <div class="flex items-center justify-between px-4 pb-0 pt-4">
              <div class="flex gap-1">
                <button
                  class="relative px-4 py-2 text-sm font-semibold transition-colors"
                  :class="
                    activeTab === 'messages'
                      ? 'text-gray-900 dark:text-neutral-100'
                      : 'text-gray-400 dark:text-neutral-500'
                  "
                  @click="activeTab = 'messages'"
                >
                  Messages
                  <!-- Unread badge in tab -->
                  <span
                    v-if="unreadMessages > 0"
                    class="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white"
                  >
                    {{ unreadMessages > 9 ? '9+' : unreadMessages }}
                  </span>
                  <span
                    v-if="activeTab === 'messages'"
                    class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand"
                  />
                </button>
                <button
                  class="relative px-4 py-2 text-sm font-semibold transition-colors"
                  :class="
                    activeTab === 'ai'
                      ? 'text-gray-900 dark:text-neutral-100'
                      : 'text-gray-400 dark:text-neutral-500'
                  "
                  @click="activeTab = 'ai'"
                >
                  Dasah
                  <span
                    v-if="activeTab === 'ai'"
                    class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand"
                  />
                </button>
                <button
                  class="relative px-4 py-2 text-sm font-semibold transition-colors"
                  :class="
                    activeTab === 'support'
                      ? 'text-gray-900 dark:text-neutral-100'
                      : 'text-gray-400 dark:text-neutral-500'
                  "
                  @click="activeTab = 'support'"
                >
                  Support
                  <span
                    v-if="activeTab === 'support'"
                    class="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-brand"
                  />
                </button>
              </div>
              <button
                class="mb-1 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
                @click="close"
              >
                <Icon name="solar:close-circle-linear" size="22" />
              </button>
            </div>
          </div>

          <!-- ── Messages tab ─────────────────────────────────────────────── -->
          <div
            v-if="activeTab === 'messages'"
            class="flex flex-1 flex-col overflow-hidden"
          >
            <!-- Search + new message -->
            <div class="flex shrink-0 items-center gap-2 px-4 py-3">
              <div class="relative flex-1">
                <Icon
                  name="solar:magnifer-linear"
                  size="18"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search messages…"
                  class="w-full rounded-xl bg-gray-100 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
                />
              </div>
              <NuxtLink
                to="/messages/new"
                class="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                @click="close"
              >
                <Icon name="solar:pen-linear" size="20" />
              </NuxtLink>
            </div>

            <!-- Conversation list -->
            <div class="flex-1 overflow-y-auto">
              <div
                v-if="isLoading"
                class="flex items-center justify-center py-16"
              >
                <Icon name="eos-icons:loading" size="32" class="text-brand" />
              </div>
              <div
                v-else-if="filteredConversations.length === 0"
                class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-neutral-500"
              >
                <Icon name="solar:chat-round-line-linear" size="48" class="mb-3" />
                <p class="text-sm">No messages yet</p>
                <NuxtLink
                  to="/messages/new"
                  class="mt-2 text-sm text-brand"
                  @click="close"
                >
                  Start a conversation
                </NuxtLink>
              </div>
              <NuxtLink
                v-for="c in filteredConversations"
                :key="c.id"
                :to="`/messages/${c.id}`"
                class="flex items-center gap-3 border-b border-gray-200 px-4 py-3 transition-colors active:bg-gray-50 dark:border-neutral-800 dark:active:bg-neutral-900"
                @click="close"
              >
                <img
                  :src="
                    c.otherUser?.avatar ||
                    `https://ui-avatars.com/api/?name=${c.otherUser?.username}&background=f02c56&color=fff`
                  "
                  class="h-12 w-12 shrink-0 rounded-full object-cover"
                />
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between">
                    <p
                      class="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100"
                    >
                      {{ c.otherUser?.username || 'Unknown' }}
                    </p>
                    <p class="ml-2 shrink-0 text-xs text-gray-400">
                      {{ formatTime(c.updated_at) }}
                    </p>
                  </div>
                  <p
                    class="truncate text-xs text-gray-500 dark:text-neutral-400"
                  >
                    Tap to open conversation
                  </p>
                </div>
              </NuxtLink>
            </div>
          </div>

          <!-- ── AI tab ───────────────────────────────────────────────────── -->
          <div
            v-else-if="activeTab === 'ai'"
            class="flex flex-1 flex-col overflow-hidden"
          >
            <DassaChat
              v-if="authStore.accessToken"
              :token="authStore.accessToken"
              :default-mode="
                profileStore.me?.role === 'SELLER' ? 'seller' : 'buyer'
              "
              class="flex-1"
            />
            <div
              v-else
              class="flex flex-1 items-center justify-center text-sm text-gray-400 dark:text-neutral-500"
            >
              Sign in to use Dasah
            </div>
          </div>

          <!-- ── Support tab ──────────────────────────────────────────────── -->
          <div v-else class="flex flex-1 flex-col overflow-hidden">
            <div class="flex shrink-0 items-center justify-between px-4 py-3">
              <p class="text-xs text-gray-400 dark:text-neutral-500">
                Your tickets &amp; disputes
              </p>
              <button
                v-if="profileStore.isLoggedIn"
                class="flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                @click="showNewTicket = true"
              >
                <Icon name="solar:add-circle-linear" size="16" /> New
              </button>
            </div>

            <div class="flex-1 overflow-y-auto">
              <!-- Signed out -->
              <div
                v-if="!profileStore.isLoggedIn"
                class="flex flex-1 items-center justify-center py-16 text-sm text-gray-400 dark:text-neutral-500"
              >
                Sign in to view your support tickets
              </div>
              <!-- Loading -->
              <div
                v-else-if="ticketsLoading"
                class="flex items-center justify-center py-16"
              >
                <Icon name="eos-icons:loading" size="32" class="text-brand" />
              </div>
              <!-- Empty -->
              <div
                v-else-if="!tickets.length"
                class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-neutral-500"
              >
                <Icon name="solar:chat-line-linear" size="48" class="mb-3" />
                <p class="text-sm">No tickets yet</p>
                <button
                  class="mt-2 text-sm text-brand"
                  @click="showNewTicket = true"
                >
                  Contact support
                </button>
              </div>
              <!-- List -->
              <NuxtLink
                v-for="t in tickets"
                :key="t.id"
                :to="`/support/${t.id}`"
                class="flex items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 transition-colors active:bg-gray-50 dark:border-neutral-800 dark:active:bg-neutral-900"
                @click="close"
              >
                <div class="min-w-0">
                  <span class="font-mono text-[11px] font-bold text-gray-400">
                    {{ ticketRef(t.ticketNumber) }}
                  </span>
                  <p
                    class="mt-0.5 truncate text-sm font-semibold text-gray-900 dark:text-neutral-100"
                  >
                    {{ t.subject }}
                  </p>
                  <p
                    class="mt-0.5 truncate text-xs text-gray-400 dark:text-neutral-500"
                  >
                    {{ t.category }}
                  </p>
                </div>
                <BaseBadge :variant="statusMeta(t.status).variant" size="sm">
                  {{ statusMeta(t.status).label }}
                </BaseBadge>
              </NuxtLink>
            </div>
          </div>

          <!-- New ticket modal -->
          <SupportNewTicketModal
            v-model="showNewTicket"
            @created="onTicketCreated"
          />
        </div>
      </Transition>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { useNotificationStore } from '~~/layers/profile/app/stores/notification.store'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useAuthStore } from '~~/layers/core/app/stores/auth.store'

import DassaChat from '~~/layers/ai/app/components/dassa/Chat.vue'
import SupportNewTicketModal from '~~/layers/support/app/components/SupportNewTicketModal.vue'
import BaseBadge from '~~/layers/ui/app/components/BaseBadge.vue'

import { ref, computed, watch } from 'vue'
import { useChat } from '~~/layers/profile/app/composables/useChat'
import { useDassaPanel } from '~~/layers/ai/app/composables/useDassaPanel'
import {
  useSupport,
  SUPPORT_STATUS_META,
  ticketRef,
} from '~~/layers/support/app/composables/useSupport'

const props = defineProps<{ isOpen: boolean; bannerVisible?: boolean }>()
const emit = defineEmits(['open', 'close'])

const profileStore = useProfileStore()
const notificationStore = useNotificationStore()
const authStore = useAuthStore()
const { fetchConversations, isLoading, conversations } = useChat()

const activeTab = ref<'messages' | 'ai' | 'support'>('messages')
const searchQuery = ref('')

// ── Support tickets ───────────────────────────────────────────────────────────
const support = useSupport()
const tickets = ref<any[]>([])
const ticketsLoading = ref(false)
const ticketsLoaded = ref(false)
const showNewTicket = ref(false)

const statusMeta = (s: string) =>
  SUPPORT_STATUS_META[s] ?? { label: s, variant: 'muted' }

// Lazy-load once, only when the Support tab is first opened (client-only —
// listMyTickets carries the Bearer token, so SSR would 401).
const loadTickets = async () => {
  if (!profileStore.isLoggedIn || ticketsLoaded.value) return
  ticketsLoading.value = true
  try {
    const res: any = await support.listMyTickets()
    tickets.value = res?.items ?? []
    ticketsLoaded.value = true
  } catch {
    // Non-fatal — empty state is shown.
  } finally {
    ticketsLoading.value = false
  }
}

watch(activeTab, (t) => {
  if (t === 'support') loadTickets()
})

const onTicketCreated = (id: string) => {
  showNewTicket.value = false
  ticketsLoaded.value = false // force a refresh next time the tab opens
  if (id) {
    close()
    navigateTo(`/support/${id}`)
  }
}

// Count unread message notifications
const unreadMessages = computed(
  () =>
    notificationStore.notifications.filter(
      (n) => !n.read && n.type === 'GENERAL',
    ).length,
)

const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value
  const q = searchQuery.value.toLowerCase()
  return conversations.value.filter(
    (c) =>
      c.otherUser?.username?.toLowerCase().includes(q) ||
      c.otherUser?.name?.toLowerCase().includes(q),
  )
})

const formatTime = (date?: string | null) => {
  if (!date) return ''
  const d = new Date(date)
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

// Switch to AI tab and open panel when a pending product message arrives
const { pendingMessage } = useDassaPanel()
watch(pendingMessage, (msg) => {
  if (msg) {
    activeTab.value = 'ai'
    emit('open')
  }
})

const open = () => {
  emit('open')
  // Switch to messages tab automatically if there are unread messages
  activeTab.value = 'messages'
  if (profileStore.isLoggedIn && conversations.value.length === 0) {
    fetchConversations()
  }
}

const close = () => emit('close')
</script>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: transform 0.25s ease;
}
.sheet-enter-from,
.sheet-leave-to {
  transform: translateY(100%);
}
</style>
