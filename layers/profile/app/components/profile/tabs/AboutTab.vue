<template>
  <div class="space-y-6 p-6">
    <!-- Bio Section -->
    <div
      v-if="profile.bio"
      class="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h3
        class="mb-3 text-lg font-semibold text-gray-900 dark:text-neutral-100"
      >
        About
      </h3>
      <p class="whitespace-pre-wrap text-gray-700 dark:text-neutral-300">
        {{ profile.bio }}
      </p>
    </div>

    <!-- Info Grid -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <!-- Website -->
      <div
        v-if="safeProfileUrl"
        class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20"
          >
            <Icon
              name="solar:link-linear"
              size="20"
              class="text-blue-600 dark:text-blue-400"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="mb-1 text-sm text-gray-500 dark:text-neutral-400">
              Profile Url
            </p>
            <a
              :href="safeProfileUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="break-all text-brand hover:underline"
            >
              {{ safeProfileUrl }}
            </a>
          </div>
        </div>
      </div>

      <!-- Location -->
      <div
        v-if="profile.stateOfResidence"
        class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20"
          >
            <Icon
              name="solar:map-point-bold"
              size="20"
              class="text-green-600 dark:text-green-400"
            />
          </div>
          <div class="flex-1">
            <p class="mb-1 text-sm text-gray-500 dark:text-neutral-400">
              Location
            </p>
            <p class="text-gray-900 dark:text-neutral-100">
              {{ profile.stateOfResidence }}
            </p>
          </div>
        </div>
      </div>

      <!-- Email (own profile only) -->
      <div
        v-if="showEmail && profile.email"
        class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand/10 dark:bg-brand/20"
          >
            <Icon
              name="solar:letter-bold"
              size="20"
              class="text-brand dark:text-brand/80"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="mb-1 text-sm text-gray-500 dark:text-neutral-400">
              Email
            </p>
            <p class="break-all text-gray-900 dark:text-neutral-100">
              {{ profile.email }}
            </p>
          </div>
        </div>
      </div>

      <!-- Joined Date -->
      <div
        class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20"
          >
            <Icon
              name="solar:calendar-bold"
              size="20"
              class="text-orange-600 dark:text-orange-400"
            />
          </div>
          <div class="flex-1">
            <p class="mb-1 text-sm text-gray-500 dark:text-neutral-400">
              Joined
            </p>
            <p class="text-gray-900 dark:text-neutral-100">
              {{ formatDate(profile.created_at as Date) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Account Type -->
    <div
      class="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <h3
        class="mb-4 text-lg font-semibold text-gray-900 dark:text-neutral-100"
      >
        Account Type
      </h3>
      <div class="flex items-center gap-3">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-full"
          :class="
            profile.role === 'SELLER'
              ? 'bg-brand/10'
              : 'bg-gray-100 dark:bg-neutral-800'
          "
        >
          <Icon
            :name="profile.role === 'SELLER' ? 'solar:shop-2-bold' : 'solar:user-linear'"
            size="24"
            :class="
              profile.role === 'SELLER'
                ? 'text-brand'
                : 'text-gray-600 dark:text-neutral-400'
            "
          />
        </div>
        <div>
          <p class="font-semibold text-gray-900 dark:text-neutral-100">
            {{
              profile.role === 'SELLER' ? 'Seller Account' : 'Personal Account'
            }}
          </p>
          <p class="text-sm text-gray-500 dark:text-neutral-400">
            {{
              profile.role === 'SELLER'
                ? 'This user can sell products'
                : 'Regular user account'
            }}
          </p>
        </div>
      </div>
    </div>

    <!-- Verification Status -->
    <div
      v-if="profile.email_verified"
      class="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/10"
    >
      <div class="flex items-center gap-2 text-green-700 dark:text-green-400">
        <Icon name="solar:check-circle-bold" size="20" />
        <span class="font-medium">Verified Account</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { IProfile } from '~~/layers/profile/app/types/profile.types'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import { safeExternalUrl } from '~~/shared/utils/safeUrl'

const props = defineProps<{
  profile: IProfile | Partial<IProfile>
}>()

const profileStore = useProfileStore()

// Render-time guard against javascript:/data: URLs in user-set profile links
const safeProfileUrl = computed(() => safeExternalUrl(props.profile?.profileUrl))

const showEmail = computed(() => {
  // Only show email on own profile
  return profileStore.me?.id === props.profile.id
})

const formatDate = (dateString: string | Date) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}
</script>
