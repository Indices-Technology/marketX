<template>
  <BaseModal
    :model-value="true"
    :title="type === 'followers' ? 'Followers' : 'Following'"
    max-width="sm"
    @update:model-value="(v) => !v && $emit('close')"
  >
    <div class="space-y-4">
      <!-- Search -->
      <BaseInput
        v-model="searchQuery"
        icon-left="mdi:magnify"
        placeholder="Search..."
      />

      <!-- Loading -->
      <div v-if="isLoading" class="py-8 text-center">
        <Icon name="eos-icons:loading" size="32" class="animate-spin text-brand" />
      </div>

      <!-- Empty -->
      <div v-else-if="filteredUsers.length === 0" class="py-8 text-center">
        <Icon
          name="mdi:account-search"
          size="48"
          class="mx-auto mb-2 text-gray-300 dark:text-neutral-700"
        />
        <p class="text-gray-500 dark:text-neutral-400">
          {{ searchQuery ? 'No users found' : `No ${type}` }}
        </p>
      </div>

      <!-- Users List -->
      <div v-else class="divide-y divide-gray-200 dark:divide-neutral-800">
        <div
          v-for="user in filteredUsers"
          :key="user.id"
          class="flex items-center justify-between py-3"
        >
          <button
            class="flex min-w-0 flex-1 items-center gap-3 text-left"
            @click="goToProfile(user.username)"
          >
            <img
              :src="
                user.avatar ||
                `https://avatar.iran.liara.run/public/boy?username=${user.username}`
              "
              :alt="user.username"
              class="h-12 w-12 flex-shrink-0 rounded-full object-cover"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-gray-900 dark:text-neutral-100">
                {{ user.username }}
              </p>
              <p
                v-if="user.bio"
                class="truncate text-sm text-gray-500 dark:text-neutral-400"
              >
                {{ user.bio }}
              </p>
            </div>
          </button>

          <BaseButton
            v-if="user.id !== currentUserId"
            :variant="user.isFollowing ? 'secondary' : 'primary'"
            size="sm"
            class="ml-3 flex-shrink-0"
            @click="toggleFollow(user)"
          >
            {{ user.isFollowing ? 'Following' : 'Follow' }}
          </BaseButton>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { useFollowStore } from '~~/layers/profile/app/stores/follow.store'
import { useFollow } from '~~/layers/profile/app/composables/useFollow'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'

const props = defineProps<{
  type: 'followers' | 'following'
  username: string
}>()

const emit = defineEmits(['close'])

const router = useRouter()
const profileStore = useProfileStore()
const followStore = useFollowStore()
const { isLoading, followUser, unfollowUser, fetchFollowers, fetchFollowing } =
  useFollow()

const searchQuery = ref('')
const currentUserId = computed(() => profileStore.me?.id)

const users = computed(() => {
  return props.type === 'followers'
    ? followStore.getFollowers(props.username)
    : followStore.getFollowing(props.username)
})

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(
    (u) =>
      u.username.toLowerCase().includes(query) ||
      u.bio?.toLowerCase().includes(query),
  )
})

onMounted(async () => {
  if (users.value.length === 0) {
    if (props.type === 'followers') {
      await fetchFollowers(props.username)
    } else {
      await fetchFollowing(props.username)
    }
  }
})

const toggleFollow = async (user: any) => {
  const isCurrentlyFollowing = followStore.isFollowing(user.id)
  try {
    if (isCurrentlyFollowing) {
      await unfollowUser(user.username)
      followStore.setFollowStatus(user.username, false)
    } else {
      await followUser(user.username)
      followStore.setFollowStatus(user.username, true)
    }
  } catch (err) {
    console.error('Follow toggle failed', err)
  }
}

const goToProfile = (targetUsername: string) => {
  router.push(`/profile/${targetUsername}`)
  emit('close')
}
</script>
