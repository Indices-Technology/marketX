<template>
  <div class="flex items-center justify-between px-3 py-2.5">
    <div class="flex min-w-0 items-center gap-2">
      <NuxtLink :to="`/profile/${post.author?.username}`" class="shrink-0">
        <Avatar
          :username="post.author?.username ?? 'User'"
          :avatar="post.author?.avatar ?? ''"
          size="sm"
        />
      </NuxtLink>
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-1.5">
          <NuxtLink
            :to="`/profile/${post.author?.username}`"
            class="text-[13px] font-semibold leading-tight text-gray-900 transition-opacity hover:opacity-75 dark:text-neutral-100"
          >
            {{ post.author?.username }}
          </NuxtLink>
          <!-- Content type badge -->
          <span
            class="inline-flex select-none items-center gap-0.5 rounded-full px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-widest"
            :class="badgeClass"
          >
            <Icon :name="badgeIcon" size="9" />
            {{ contentTypeLabel }}
          </span>
          <!-- Follow button (only on others' posts) -->
          <template
            v-if="
              profileStore.userId &&
              post.author &&
              profileStore.userId !== post.author.id
            "
          >
            <span
              class="select-none text-xs text-gray-300 dark:text-neutral-600"
              >·</span
            >
            <FollowButton
              :user-id="post.author.id"
              :username="post.author?.username"
            />
          </template>
        </div>
      </div>
    </div>
    <!-- ─── Mod menu (admin / moderator only, any post) ─────── -->
    <div v-if="isMod" class="relative ml-1 shrink-0" ref="modRoot">
      <button
        aria-label="Mod actions"
        :disabled="!!moderating"
        @click.stop="modOpen = !modOpen"
        class="rounded-full p-1 text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Icon v-if="!moderating" name="solar:shield-linear" size="18" />
        <svg v-else class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </button>
      <Transition name="fade">
        <div
          v-if="modOpen"
          class="absolute right-0 top-8 z-30 w-44 overflow-hidden rounded-xl border border-rose-100 bg-white shadow-lg dark:border-rose-900/30 dark:bg-neutral-900"
          @click.stop
        >
          <p class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-rose-400">
            Mod Actions
          </p>
          <button
            @click="onModerate('HIDDEN')"
            :disabled="!!moderating"
            class="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-amber-600 transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-50"
          >
            <Icon v-if="moderating !== 'HIDDEN'" name="solar:eye-closed-linear" size="15" />
            <svg v-else class="animate-spin shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Hide post
          </button>
          <button
            @click="onModerate('REMOVED')"
            :disabled="!!moderating"
            class="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
          >
            <Icon v-if="moderating !== 'REMOVED'" name="solar:trash-bin-trash-linear" size="15" />
            <svg v-else class="animate-spin shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Remove post
          </button>
          <button
            @click="onModerate('ACTIVE')"
            :disabled="!!moderating"
            class="flex w-full items-center gap-2 px-3 py-2.5 text-[13px] text-green-600 transition-colors hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50"
          >
            <Icon v-if="moderating !== 'ACTIVE'" name="solar:restart-linear" size="15" />
            <svg v-else class="animate-spin shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Restore
          </button>
        </div>
      </Transition>
    </div>

    <!-- ─── Owner actions menu ──────────────────────────────── -->
    <div v-if="isOwner" class="relative ml-1 shrink-0">
      <button
        aria-label="Post options"
        :aria-expanded="menuOpen"
        @click.stop="menuOpen = !menuOpen"
        class="rounded-full p-1 text-gray-400 transition-colors hover:text-gray-700 dark:text-neutral-500 dark:hover:text-neutral-200"
      >
        <Icon name="solar:menu-dots-bold" size="20" />
      </button>
      <div
        v-if="menuOpen"
        class="absolute right-0 top-8 z-20 min-w-[140px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-800"
        @click.stop
      >
        <button
          @click="onEdit"
          class="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-gray-700 transition-colors hover:bg-gray-50 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          <Icon name="solar:pen-linear" size="16" />
          {{ $t('post.editPost') }}
        </button>
        <button
          @click="onDelete"
          class="flex w-full items-center gap-2 px-4 py-2.5 text-[13px] text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <Icon name="solar:trash-bin-trash-linear" size="16" />
          {{ $t('post.deletePost') }}
        </button>
      </div>
    </div>
    <button
      v-else-if="!isMod"
      aria-label="More options"
      class="ml-1 shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:text-gray-700 dark:text-neutral-500 dark:hover:text-neutral-200"
    >
      <Icon name="solar:menu-dots-bold" size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import FollowButton from '~~/layers/profile/app/components/FollowButton.vue'
import Avatar from '~~/layers/profile/app/components/Avatar.vue'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useAdminApi } from '~~/layers/admin/app/services/admin.api'
import type { IFeedItem } from '~~/layers/feed/app/types/feed.types'

const props = defineProps<{
  post: IFeedItem
  isOwner: boolean
  isMod: boolean
}>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'moderate', status: string): void
}>()

const profileStore = useProfileStore()

const menuOpen = ref(false)
const modOpen = ref(false)
const modRoot = ref<HTMLElement | null>(null)

const onEdit = () => {
  menuOpen.value = false
  emit('edit')
}

const onDelete = () => {
  menuOpen.value = false
  emit('delete')
}

const moderating = ref<string | null>(null)

const onModerate = async (status: 'ACTIVE' | 'HIDDEN' | 'REMOVED') => {
  if (moderating.value) return
  modOpen.value = false
  moderating.value = status
  try {
    await useAdminApi().moderateContent('POST', props.post.id, status)
    emit('moderate', status)
  } catch {
    moderating.value = null
  }
}

const closeMenu = () => {
  menuOpen.value = false
  modOpen.value = false
}
onMounted(() => document.addEventListener('click', closeMenu))
onUnmounted(() => document.removeEventListener('click', closeMenu))

// ─── Content type system ──────────────────────────────────────────────────────
const { t } = useI18n()

const CONTENT_TYPE_MAP: Record<string, { icon: string; accent: string; badge: string }> = {
  EXPERIENCE: {
    icon: 'solar:star-linear',
    accent: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  INSPIRATION: {
    icon: 'solar:lightbulb-linear',
    accent: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  COMMERCE: {
    icon: 'solar:bag-4-linear',
    accent: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  EDUCATIONAL: {
    icon: 'solar:square-academic-cap-2-linear',
    accent: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  },
  ENTERTAINMENT: {
    icon: 'solar:music-note-2-bold',
    accent: 'bg-pink-500',
    badge: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  },
}

const contentTypeDef = computed(
  () =>
    CONTENT_TYPE_MAP[props.post.contentType] ?? {
      icon: 'solar:tag-linear',
      accent: 'bg-gray-300 dark:bg-neutral-700',
      badge: 'bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-neutral-400',
    },
)

const contentTypeLabel = computed(() =>
  t(`contentType.${props.post.contentType}`, props.post.contentType),
)
const badgeIcon = computed(() => contentTypeDef.value.icon)
const badgeClass = computed(() => contentTypeDef.value.badge)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s, transform 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
