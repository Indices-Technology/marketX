<template>
  <div
    role="button"
    tabindex="0"
    class="flex w-full cursor-pointer items-start gap-3 border-b border-gray-200 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 dark:border-neutral-800/50 dark:hover:bg-neutral-900"
    :class="{ 'bg-brand/5 dark:bg-brand/10': !notification.read }"
    @click="onRowClick"
  >
    <!-- Avatar (links to the actor's profile when we have one) -->
    <div class="relative shrink-0">
      <NuxtLink
        v-if="notification.actor?.username"
        :to="`/profile/${notification.actor.username}`"
        @click.stop="onLinkClick"
      >
        <img
          v-if="notification.actor?.avatar"
          :src="imgAvatar(notification.actor.avatar)"
          class="h-10 w-10 rounded-full object-cover"
        />
        <div
          v-else
          class="flex h-10 w-10 items-center justify-center rounded-full bg-brand"
        >
          <Icon :name="view.icon" size="18" class="text-white" />
        </div>
      </NuxtLink>
      <div
        v-else
        class="flex h-10 w-10 items-center justify-center rounded-full bg-brand"
      >
        <Icon :name="view.icon" size="18" class="text-white" />
      </div>
      <span
        class="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white ring-1 ring-gray-200 dark:bg-neutral-950 dark:ring-neutral-800"
      >
        <Icon :name="view.icon" size="11" class="text-brand" />
      </span>
    </div>

    <!-- Text (segmented: actor name / order id are links) -->
    <div class="min-w-0 flex-1">
      <p
        class="text-sm leading-snug text-gray-900 dark:text-neutral-100"
        :class="{ 'font-semibold': !notification.read }"
      >
        <template v-for="(seg, i) in view.segments" :key="i">
          <NuxtLink
            v-if="seg.to"
            :to="seg.to"
            class="font-semibold text-brand hover:underline"
            @click.stop="onLinkClick"
            >{{ seg.text }}</NuxtLink
          >
          <span v-else>{{ seg.text }}</span>
        </template>
      </p>
      <p class="mt-0.5 text-[11px] text-gray-400 dark:text-neutral-500">
        {{ timeAgo(notification.created_at) }}
      </p>
    </div>

    <!-- Unread dot -->
    <span
      v-if="!notification.read"
      class="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'
import type { INotification } from '~~/layers/profile/app/types/profile.types'
import { presentNotification } from '~~/layers/profile/app/utils/notificationPresenter'
import { useNotificationApi } from '~~/layers/profile/app/services/notification.api'
import { useNotificationStore } from '~~/layers/profile/app/stores/notification.store'

const props = defineProps<{ notification: INotification }>()
// `navigate` lets a host (e.g. the slide-over panel) close itself on click.
const emit = defineEmits<{ navigate: [] }>()

const router = useRouter()
const api = useNotificationApi()
const store = useNotificationStore()

const view = computed(() => presentNotification(props.notification))

// Fire-and-forget so navigation is instant.
const markRead = () => {
  if (props.notification.read) return
  api
    .markAsRead(props.notification.id)
    .then(() => store.markAsRead(props.notification.id))
    .catch(() => {
      /* silent */
    })
}

// Actor-name / order-id links: NuxtLink navigates; we just mark read + notify host.
const onLinkClick = () => {
  markRead()
  emit('navigate')
}

// Whole-row click → the notification's primary destination.
const onRowClick = () => {
  markRead()
  emit('navigate')
  if (view.value.to) router.push(view.value.to)
}

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'Just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}
</script>
