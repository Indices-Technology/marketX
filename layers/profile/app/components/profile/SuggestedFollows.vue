<template>
  <!-- Only meaningful for signed-in users; hide entirely otherwise -->
  <div v-if="profileStore.isLoggedIn && (loading || users.length)">
    <!-- Compact variant — sidebar card -->
    <div
      v-if="compact"
      class="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-800/40"
    >
      <div class="mb-3 flex items-center gap-2">
        <Icon
          name="solar:users-group-rounded-linear"
          size="18"
          class="text-brand"
        />
        <h3 class="ink-strong text-sm font-bold">Who to follow</h3>
      </div>

      <div v-if="loading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="flex items-center gap-3">
          <BaseSkeleton shape="avatar" />
          <div class="flex-1 space-y-1.5">
            <BaseSkeleton shape="line" width="55%" />
            <BaseSkeleton shape="line" width="35%" />
          </div>
        </div>
      </div>

      <div v-else class="space-y-1.5">
        <div
          v-for="user in users"
          :key="user.id"
          class="-mx-2 flex items-center gap-3 rounded-xl border border-transparent p-2 transition-all hover:border-gray-200 hover:bg-white dark:hover:border-neutral-700 dark:hover:bg-neutral-800/60"
        >
          <NuxtLink
            :to="`/profile/${user.username}`"
            class="flex min-w-0 flex-1 items-center gap-2.5"
          >
            <Avatar
              :username="user.username || 'User'"
              :avatar="user.avatar || ''"
              size="md"
            />
            <div class="min-w-0 flex-1">
              <p class="ink-strong truncate text-[12px] font-semibold">
                {{ user.username }}
              </p>
              <p v-if="user.bio" class="ink-faint truncate text-[10px]">
                {{ user.bio }}
              </p>
            </div>
          </NuxtLink>
          <FollowButton
            :user-id="user.id"
            :username="user.username"
            class="shrink-0"
          />
        </div>
      </div>
    </div>

    <!-- Full variant — inline block -->
    <div v-else>
      <div class="mb-3 flex items-center justify-between">
        <div>
          <p
            class="mb-0.5 text-[11px] font-bold uppercase tracking-widest text-brand"
          >
            Discover people
          </p>
          <h3 class="ink-strong font-display text-base font-bold">
            Who to follow
          </h3>
        </div>
      </div>

      <div
        v-if="loading"
        class="divide-y divide-gray-100 dark:divide-neutral-800"
      >
        <div v-for="i in limit" :key="i" class="flex items-center gap-3 py-3">
          <BaseSkeleton shape="avatar" />
          <div class="flex-1 space-y-1.5">
            <BaseSkeleton shape="line" width="40%" />
            <BaseSkeleton shape="line" width="60%" />
          </div>
        </div>
      </div>

      <div v-else class="divide-y divide-gray-100 dark:divide-neutral-800">
        <div
          v-for="user in users"
          :key="user.id"
          class="flex items-center gap-3 py-3"
        >
          <NuxtLink
            :to="`/profile/${user.username}`"
            class="flex min-w-0 flex-1 items-center gap-3"
          >
            <Avatar
              :username="user.username || 'User'"
              :avatar="user.avatar || ''"
              size="lg"
            />
            <div class="min-w-0 flex-1">
              <p class="ink-strong truncate text-sm font-semibold">
                {{ user.username }}
              </p>
              <p v-if="user.bio" class="ink-faint truncate text-xs">
                {{ user.bio }}
              </p>
            </div>
          </NuxtLink>
          <FollowButton
            :user-id="user.id"
            :username="user.username"
            class="shrink-0"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProfileStore } from '../../stores/profile.store'
import { useFollow } from '../../composables/useFollow'
import Avatar from '../Avatar.vue'
import FollowButton from '../FollowButton.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'

const props = withDefaults(
  defineProps<{
    compact?: boolean
    limit?: number
  }>(),
  { compact: false, limit: 5 },
)

const profileStore = useProfileStore()
const { fetchSuggestedUsers, checkFollowingBatch } = useFollow()

const users = ref<
  Array<{
    id: string
    username: string
    avatar?: string | null
    bio?: string | null
  }>
>([])
const loading = ref(false)

onMounted(async () => {
  if (!profileStore.isLoggedIn) return
  loading.value = true
  try {
    const result = await fetchSuggestedUsers(props.limit)
    users.value = Array.isArray(result) ? result : []
    // Pre-hydrate follow status so each FollowButton skips its own request
    if (users.value.length) {
      const idToUsername = Object.fromEntries(
        users.value.map((u) => [u.id, u.username]),
      )
      await checkFollowingBatch(
        users.value.map((u) => u.id),
        'USER',
        idToUsername,
      )
    }
  } catch {
    users.value = []
  } finally {
    loading.value = false
  }
})
</script>
