<template>
  <div class="p-4 sm:p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
        Messages
      </h1>
      <p class="mt-0.5 text-sm text-gray-500 dark:text-neutral-400">
        {{ total }} conversation{{ total === 1 ? '' : 's' }}
      </p>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by buyer name..."
        class="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder-neutral-500"
      />
    </div>

    <!-- Loading skeleton -->
    <div v-if="isLoading && !conversations.length" class="space-y-3">
      <div
        v-for="i in 4"
        :key="i"
        class="h-20 animate-pulse rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      />
    </div>

    <!-- Conversations list -->
    <div v-else-if="filtered.length" class="space-y-2">
      <div
        v-for="conv in filtered"
        :key="conv.id"
        class="flex cursor-pointer items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
        @click="openConversation(conv.id)"
      >
        <!-- Buyer avatar -->
        <Avatar
          :avatar="conv.participant1?.avatar"
          :username="conv.participant1?.username"
          size="lg"
        />

        <!-- Content -->
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <p
              class="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100"
            >
              {{
                conv.participant1?.name ||
                conv.participant1?.username ||
                'Buyer'
              }}
            </p>
            <div class="flex shrink-0 items-center gap-2">
              <span class="text-[11px] text-gray-400 dark:text-neutral-500">
                {{ formatTime(conv.lastMessageAt || conv.created_at) }}
              </span>
              <span
                v-if="(conv.unreadCount ?? 0) > 0"
                class="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold text-white"
                >{{ conv.unreadCount > 99 ? '99+' : conv.unreadCount }}</span
              >
            </div>
          </div>

          <!-- Product context -->
          <p
            v-if="conv.currentProduct"
            class="truncate text-[11px] font-medium text-brand"
          >
            re: {{ conv.currentProduct.title }}
          </p>

          <!-- Last message preview -->
          <p
            class="truncate text-xs"
            :class="
              (conv.unreadCount ?? 0) > 0
                ? 'font-semibold text-gray-900 dark:text-neutral-100'
                : 'text-gray-500 dark:text-neutral-400'
            "
          >
            {{ conv.messages?.[0]?.content || 'Start of conversation' }}
          </p>
        </div>

        <Icon
          name="solar:alt-arrow-right-linear"
          size="18"
          class="shrink-0 text-gray-400 dark:text-neutral-500"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-24 text-center"
    >
      <div
        class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
      >
        <Icon
          name="solar:chat-round-line-linear"
          size="32"
          class="text-gray-400 dark:text-neutral-500"
        />
      </div>
      <p class="font-medium text-gray-900 dark:text-neutral-100">
        No messages yet
      </p>
      <p class="mt-1 text-sm text-gray-500 dark:text-neutral-400">
        Buyers who message your store will appear here
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { definePageMeta } from '#imports'
import Avatar from '~~/layers/profile/app/components/Avatar.vue'
import { useSeo } from '~~/layers/core/app/composables/useSeo'
import { useSellerApi } from '~~/layers/seller/app/services/seller.services'
import { useSellerManagement } from '~~/layers/seller/app/composables/useSellerManagement'
import { useNotificationStore } from '~~/layers/profile/app/stores/notification.store'

definePageMeta({ middleware: 'auth', layout: 'store-layout' })

useSeo().setInboxPage()

const sellerApi = useSellerApi()
const route = useRoute()
const router = useRouter()
const storeSlug = computed(() => route.params.storeSlug as string)

const conversations = ref<any[]>([])
const total = ref(0)
const isLoading = ref(true)
const searchQuery = ref('')

// Find this store's sellerId via useSellerManagement (same pattern as the
// dashboard page). Avoid importing the seller store directly — that direct
// import fails to resolve here and crashes setup.
const { loadUserSellers, sellers } = useSellerManagement()
const currentSeller = computed(() =>
  sellers.value?.find((s: any) => s.store_slug === storeSlug.value),
)

const filtered = computed(() => {
  if (!searchQuery.value) return conversations.value
  const q = searchQuery.value.toLowerCase()
  return conversations.value.filter(
    (c) =>
      c.participant1?.username?.toLowerCase().includes(q) ||
      c.participant1?.name?.toLowerCase().includes(q),
  )
})

const loadMessages = async () => {
  isLoading.value = true
  try {
    // On a fresh page load the sellers list may be empty — load it so we can
    // resolve this store's sellerId.
    if (!currentSeller.value) await loadUserSellers().catch(() => {})
    const sellerId = currentSeller.value?.id
    if (!sellerId) return
    const res = await sellerApi.getSellerMessages(sellerId)
    conversations.value = res?.data?.conversations || []
    total.value = res?.data?.total || 0
  } catch {
    // BaseApiClient handles toast
  } finally {
    isLoading.value = false
  }
}

const openConversation = (conversationId: string) => {
  router.push(`/messages/${conversationId}`)
}

const formatTime = (date: string) => {
  if (!date) return ''
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'now'
  if (diffMins < 60) return `${diffMins}m`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

onMounted(loadMessages)

// Re-fetch when a new MESSAGE notification arrives
const notificationStore = useNotificationStore()
watch(
  () => notificationStore.notifications[0],
  (n) => {
    if (n?.type === 'MESSAGE') loadMessages()
  },
)
</script>
