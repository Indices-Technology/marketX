<template>
  <div class="p-4">
    <!-- Search — only worth showing once there's a list to filter -->
    <div v-if="users.length > 5" class="mb-4">
      <BaseInput
        v-model="searchQuery"
        icon-left="solar:magnifer-linear"
        :placeholder="
          type === 'followers' ? 'Search followers…' : 'Search following…'
        "
      />
    </div>

    <!-- Loading (initial) -->
    <div
      v-if="loadingInitial"
      class="divide-y divide-gray-100 dark:divide-neutral-800"
    >
      <div v-for="i in 6" :key="i" class="flex items-center gap-3 py-3">
        <BaseSkeleton shape="avatar" />
        <div class="flex-1 space-y-1.5">
          <BaseSkeleton shape="line" width="35%" />
          <BaseSkeleton shape="line" width="55%" />
        </div>
      </div>
    </div>

    <!-- Empty -->
    <template v-else-if="filteredUsers.length === 0">
      <!-- Filtered to nothing -->
      <BaseEmptyState
        v-if="searchQuery"
        icon="solar:magnifer-linear"
        title="No matches"
        :description="`No ${type} match “${searchQuery}”.`"
        compact
      />
      <!-- Genuinely empty -->
      <template v-else>
        <BaseEmptyState
          :icon="
            type === 'followers'
              ? 'solar:users-group-rounded-linear'
              : 'solar:user-plus-linear'
          "
          :title="
            type === 'followers'
              ? 'No followers yet'
              : isOwnProfile
                ? 'You’re not following anyone yet'
                : 'Not following anyone yet'
          "
          :description="
            type === 'followers'
              ? isOwnProfile
                ? 'Share your profile and post to start growing your audience.'
                : 'When people follow this account, they’ll show up here.'
              : isOwnProfile
                ? 'Follow people to build your feed — start with the suggestions below.'
                : 'When this account follows people, they’ll show up here.'
          "
        >
          <template v-if="type === 'followers' && isOwnProfile" #actions>
            <BaseButton
              variant="primary"
              size="sm"
              @click="$router.push('/discover')"
            >
              Discover people
            </BaseButton>
          </template>
        </BaseEmptyState>

        <!-- Following + own profile → surface suggestions right in the empty state -->
        <div v-if="type === 'following' && isOwnProfile" class="mt-6">
          <SuggestedFollows :limit="6" />
        </div>
      </template>
    </template>

    <!-- List -->
    <div v-else class="divide-y divide-gray-100 dark:divide-neutral-800">
      <div
        v-for="user in filteredUsers"
        :key="user.id"
        class="flex items-center gap-3 py-3"
      >
        <NuxtLink
          :to="rowLink(user)"
          class="flex min-w-0 flex-1 items-center gap-3"
        >
          <Avatar
            :username="user.username || 'User'"
            :avatar="user.avatar || ''"
            size="lg"
          />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-1.5">
              <p class="ink-strong truncate text-sm font-semibold">
                {{ user.name || user.username }}
              </p>
              <span
                v-if="user.type === 'SELLER'"
                class="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              >
                <Icon name="solar:shop-2-bold" size="9" />
                Store
              </span>
            </div>
            <p v-if="user.bio" class="ink-faint truncate text-xs">
              {{ user.bio }}
            </p>
          </div>
        </NuxtLink>

        <!-- Follow-back for people (not yourself); stores just link through -->
        <FollowButton
          v-if="user.type !== 'SELLER' && user.id !== currentUserId"
          :user-id="user.id"
          :username="user.username"
          class="shrink-0"
        />
      </div>

      <!-- Load more -->
      <div v-if="hasMore" class="pt-3">
        <BaseButton
          variant="ghost"
          size="sm"
          :loading="loadingMore"
          class="w-full"
          @click="loadMore"
        >
          Show more
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useProfileStore } from '../../../stores/profile.store'
import { useFollowStore } from '../../../stores/follow.store'
import { useFollow } from '../../../composables/useFollow'
import Avatar from '../../Avatar.vue'
import FollowButton from '../../FollowButton.vue'
import SuggestedFollows from '../SuggestedFollows.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'

const props = defineProps<{
  type: 'followers' | 'following'
  username: string
  isOwnProfile?: boolean
}>()

type FollowItem = {
  id: string
  username: string
  name?: string | null
  avatar?: string | null
  bio?: string | null
  type?: 'USER' | 'SELLER'
}

const PAGE = 20

const profileStore = useProfileStore()
const followStore = useFollowStore()
const { fetchFollowers, fetchFollowing, checkFollowingBatch } = useFollow()

const searchQuery = ref('')
const loadingInitial = ref(false)
const loadingMore = ref(false)
const hasMore = ref(false)
const offset = ref(0)

const currentUserId = computed(() => profileStore.me?.id)

const users = computed<FollowItem[]>(() =>
  props.type === 'followers'
    ? followStore.getFollowers(props.username)
    : followStore.getFollowing(props.username),
)

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const q = searchQuery.value.toLowerCase()
  return users.value.filter(
    (u) =>
      (u.username || '').toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.bio || '').toLowerCase().includes(q),
  )
})

const rowLink = (user: FollowItem) =>
  user.type === 'SELLER'
    ? `/sellers/profile/${user.username}`
    : `/profile/${user.username}`

const fetchPage = async (nextOffset: number) => {
  const fetcher = props.type === 'followers' ? fetchFollowers : fetchFollowing
  const result = await fetcher(props.username, PAGE, nextOffset)
  hasMore.value = !!result?.meta?.hasMore
  offset.value = nextOffset + (result?.items?.length ?? 0)
  // Pre-hydrate follow status for people so each FollowButton skips its own call.
  // Guests have no token — the batch endpoint is auth-only, so skip it for them
  // (otherwise the 401 handler force-logs-out and bounces to /user-login).
  const userItems = ((result?.items ?? []) as FollowItem[]).filter(
    (u) => u.type !== 'SELLER',
  )
  if (profileStore.isLoggedIn && userItems.length) {
    const idToUsername = Object.fromEntries(
      userItems.map((u) => [u.id, u.username]),
    )
    await checkFollowingBatch(
      userItems.map((u) => u.id),
      'USER',
      idToUsername,
    )
  }
}

const loadInitial = async () => {
  loadingInitial.value = true
  offset.value = 0
  try {
    await fetchPage(0)
  } catch {
    /* composable surfaces the error toast */
  } finally {
    loadingInitial.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    await fetchPage(offset.value)
  } catch {
    /* composable surfaces the error toast */
  } finally {
    loadingMore.value = false
  }
}

onMounted(loadInitial)
// Re-fetch when switching followers ⇄ following or navigating to another profile
watch(() => [props.type, props.username], loadInitial)
</script>
