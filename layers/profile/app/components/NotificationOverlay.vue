<template>
  <Teleport to="body">
    <Transition name="slide-left">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex">
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/20 md:hidden"
          @click="$emit('close')"
        />

        <!-- Panel -->
        <div
          ref="panelEl"
          class="relative ml-auto flex h-full w-full flex-col border-l border-gray-200 bg-white md:w-96 dark:border-neutral-800 dark:bg-neutral-950"
        >
          <!-- Header -->
          <div
            class="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3.5 dark:border-neutral-800"
          >
            <div class="flex items-center gap-2">
              <button
                class="-ml-1.5 rounded-full p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-neutral-800"
                @click="$emit('close')"
              >
                <Icon name="solar:arrow-left-linear" size="22" />
              </button>
              <h2
                class="text-base font-semibold text-gray-900 dark:text-neutral-100"
              >
                Notifications
              </h2>
              <span
                v-if="unreadCount > 0"
                class="rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold leading-none text-white"
                >{{ unreadCount }}</span
              >
            </div>
            <button
              v-if="unreadCount > 0"
              class="text-sm font-semibold text-brand transition-opacity hover:opacity-75"
              @click="handleMarkAllRead"
            >
              Mark all read
            </button>
          </div>

          <!-- List -->
          <div class="flex-1 overflow-y-auto">
            <!-- Skeleton -->
            <div
              v-if="isLoading && !notifications.length"
              class="space-y-4 p-4"
            >
              <div v-for="i in 6" :key="i" class="flex animate-pulse gap-3">
                <div
                  class="h-10 w-10 shrink-0 rounded-full bg-gray-200 dark:bg-neutral-800"
                />
                <div class="flex-1 space-y-2 pt-1">
                  <div
                    class="h-3 w-4/5 rounded bg-gray-200 dark:bg-neutral-800"
                  />
                  <div
                    class="h-2.5 w-1/3 rounded bg-gray-200 dark:bg-neutral-800"
                  />
                </div>
              </div>
            </div>

            <!-- Items -->
            <template v-else-if="notifications.length > 0">
              <NotificationItem
                v-for="notif in notifications"
                :key="notif.id"
                :notification="notif"
                @navigate="$emit('close')"
              />

              <!-- Load more -->
              <div v-if="hasMore" class="p-4 text-center">
                <button
                  :disabled="isLoading"
                  class="text-sm font-medium text-brand hover:underline disabled:opacity-50"
                  @click="loadMore"
                >
                  {{ isLoading ? 'Loading…' : 'Load more' }}
                </button>
              </div>
            </template>

            <!-- Empty -->
            <div
              v-else
              class="flex h-full flex-col items-center justify-center px-6 py-20 text-center"
            >
              <div
                class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-neutral-800"
              >
                <Icon
                  name="solar:bell-linear"
                  size="32"
                  class="text-gray-400 dark:text-neutral-500"
                />
              </div>
              <p class="font-medium text-gray-900 dark:text-neutral-100">
                All caught up!
              </p>
              <p class="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                New activity will appear here
              </p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'
import { useNotificationStore } from '~~/layers/profile/app/stores/notification.store'
import { useNotificationApi } from '~~/layers/profile/app/services/notification.api'
import type { INotification } from '~~/layers/profile/app/types/profile.types'
import NotificationItem from './NotificationItem.vue'

const props = defineProps<{ isOpen: boolean }>()
const emit = defineEmits(['close'])

const panelEl = ref<HTMLElement | null>(null)

onClickOutside(panelEl, () => {
  if (props.isOpen) emit('close')
})

const api = useNotificationApi()
const store = useNotificationStore()

const isLoading = ref(false)
const offset = ref(0)
const total = ref(0)
const LIMIT = 20

const notifications = computed(() => store.notifications)
const unreadCount = computed(() => store.unreadCount)
const hasMore = computed(() => notifications.value.length < total.value)

const load = async (reset = false) => {
  if (isLoading.value) return
  isLoading.value = true
  try {
    if (reset) {
      store.clearNotifications()
      offset.value = 0
    }
    // Server returns { success, data: { notifications: [], total } }
    const res = (await api.getNotifications(
      LIMIT,
      offset.value,
    )) as unknown as {
      data: { notifications: INotification[]; total: number }
    }
    const items = res?.data?.notifications ?? []
    total.value = res?.data?.total ?? 0
    if (reset) {
      store.setNotifications(items)
    } else {
      items.forEach((n) => store.addNotification(n))
    }
    offset.value += items.length
  } catch {
    /* non-fatal */
  } finally {
    isLoading.value = false
  }
}

const loadMore = () => load(false)

const handleMarkAllRead = async () => {
  try {
    await api.markAllAsRead()
    store.setNotifications(
      notifications.value.map((n) => ({ ...n, read: true })),
    )
  } catch {
    /* silent */
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) load(true)
  },
)
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active {
  transition: opacity 0.2s ease;
}
.slide-left-enter-active > div:last-child,
.slide-left-leave-active > div:last-child {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-left-enter-from > div:last-child,
.slide-left-leave-to > div:last-child {
  transform: translateX(100%);
}
.slide-left-enter-from,
.slide-left-leave-to {
  opacity: 0;
}
</style>
