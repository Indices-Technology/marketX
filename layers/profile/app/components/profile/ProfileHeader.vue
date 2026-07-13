<template>
  <div
    class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
  >
    <!-- Accent stripe -->
    <div class="h-[3px] w-full" :class="accentClass" />

    <div class="p-5">
      <div class="flex items-start gap-5">
        <!-- Avatar -->
        <div class="relative shrink-0">
          <img
            :src="avatarSrc(profile.avatar, profile.username)"
            :alt="profile.username || 'Avatar'"
            class="h-20 w-20 rounded-full object-cover ring-2 ring-gray-100 sm:h-28 sm:w-28 dark:ring-neutral-800"
            loading="eager"
            decoding="async"
          />
          <div
            v-if="profile.role === 'SELLER'"
            class="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white dark:ring-neutral-900"
          >
            <Icon name="solar:shop-2-bold" size="13" class="text-white" />
          </div>
        </div>

        <!-- Info -->
        <div class="min-w-0 flex-1">
          <!-- Username + actions -->
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <h1
              class="t-heading text-[17px] leading-tight"
            >
              {{ profile.username }}
            </h1>
            <span
              v-if="profile.role === 'SELLER'"
              class="inline-flex select-none items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            >
              <Icon name="solar:shop-2-bold" size="9" />
              {{ $t('profile.seller') }}
            </span>

            <!-- Own profile -->
            <template v-if="isOwnProfile">
              <button
                @click="$emit('edit')"
                class="ml-auto rounded-lg bg-gray-100 px-3.5 py-1.5 text-[13px] font-semibold text-gray-900 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
              >
                {{ $t('profile.editProfile') }}
              </button>
              <button
                @click="$emit('settings')"
                aria-label="Settings"
                class="rounded-lg bg-gray-100 p-1.5 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                <Icon name="solar:settings-linear" size="18" />
              </button>
            </template>

            <!-- Other profile -->
            <template v-else>
              <button
                @click="isFollowing ? $emit('unfollow') : $emit('follow')"
                :disabled="isFollowLoading"
                class="ml-auto min-w-[80px] rounded-lg px-5 py-1.5 text-center text-[13px] font-semibold transition-colors disabled:opacity-60"
                :class="
                  isFollowing
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700'
                    : 'bg-brand text-white hover:bg-[#d81b36]'
                "
              >
                <Icon
                  v-if="isFollowLoading"
                  name="eos-icons:loading"
                  size="14"
                  class="inline animate-spin"
                />
                <span v-else>{{
                  $t(isFollowing ? 'post.following' : 'post.follow')
                }}</span>
              </button>
              <button
                @click="$emit('message')"
                class="rounded-lg bg-gray-100 px-4 py-1.5 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                {{ $t('profile.message') }}
              </button>
              <button
                aria-label="More options"
                class="rounded-lg bg-gray-100 p-1.5 text-gray-500 transition-colors hover:bg-gray-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              >
                <Icon name="solar:menu-dots-bold" size="18" />
              </button>
            </template>
          </div>

          <!-- Stats -->
          <div class="mb-3 flex items-center gap-5">
            <div class="text-center">
              <div
                class="font-display text-[15px] font-bold leading-tight ink-strong"
              >
                {{ formatNum(stats.postsCount) }}
              </div>
              <div class="text-[11px] ink-faint">
                {{ $t('profile.posts') }}
              </div>
            </div>
            <button
              @click="$emit('show-followers')"
              class="text-center transition-opacity hover:opacity-70"
            >
              <div
                class="font-display text-[15px] font-bold leading-tight ink-strong"
              >
                {{ formatNum(stats.followersCount) }}
              </div>
              <div class="text-[11px] ink-faint">
                {{ $t('profile.followers') }}
              </div>
            </button>
            <button
              @click="$emit('show-following')"
              class="text-center transition-opacity hover:opacity-70"
            >
              <div
                class="font-display text-[15px] font-bold leading-tight ink-strong"
              >
                {{ formatNum(stats.followingCount) }}
              </div>
              <div class="text-[11px] ink-faint">
                {{ $t('profile.following') }}
              </div>
            </button>
            <div v-if="stats.likesCount" class="text-center">
              <div
                class="font-display text-[15px] font-bold leading-tight ink-strong"
              >
                {{ formatNum(stats.likesCount) }}
              </div>
              <div class="text-[11px] ink-faint">
                {{ $t('profile.likes') }}
              </div>
            </div>
          </div>

          <!-- Bio -->
          <p
            v-if="profile.bio"
            class="mb-1.5 whitespace-pre-wrap text-[13px] leading-relaxed ink"
          >
            {{ profile.bio }}
          </p>

          <!-- Links -->
          <div class="flex flex-wrap items-center gap-3 text-[12px]">
            <a
              v-if="safeProfileUrl"
              :href="safeProfileUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-1 text-brand hover:underline"
            >
              <Icon name="solar:link-round-linear" size="13" />
              {{ safeProfileUrl.replace(/^https?:\/\//, '').split('/')[0] }}
            </a>
            <span
              v-if="profile.stateOfResidence"
              class="flex items-center gap-1 ink-faint"
            >
              <Icon name="solar:map-point-linear" size="13" />
              {{ profile.stateOfResidence }}
            </span>
          </div>

          <!-- View Store — shown when this profile owns an active store.
               Subtitle is the memorable store address, copyable in one tap. -->
          <div
            v-if="store?.store_slug"
            class="mt-3 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          >
            <NuxtLink
              :to="storePath(store.store_slug)"
              class="flex min-w-0 flex-1 items-center gap-2.5"
            >
              <div
                class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500"
              >
                <Icon name="solar:shop-bold" size="18" class="text-white" />
              </div>
              <div class="min-w-0 flex-1">
                <p
                  class="truncate text-[13px] font-semibold ink-strong"
                >
                  {{ store.store_name || 'Visit store' }}
                </p>
                <p
                  class="truncate text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
                >
                  {{ storeAddressLabel }}
                </p>
              </div>
            </NuxtLink>
            <button
              type="button"
              :title="`Copy ${storeAddressLabel}`"
              class="shrink-0 rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-100 dark:text-emerald-500 dark:hover:bg-emerald-950/60"
              @click="copyStoreAddress"
            >
              <Icon
                :name="addressCopied ? 'solar:check-circle-linear' : 'solar:copy-linear'"
                size="16"
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRuntimeConfig } from '#imports'
import { notify } from '@kyvg/vue3-notification'
import type { IProfile, IProfileStats } from '../../types/profile.types'
import { avatarSrc } from '~~/layers/core/app/utils/cloudinary'
import { safeExternalUrl } from '~~/shared/utils/safeUrl'
import {
  storeDisplayUrl,
  storePath,
  storeShareUrl,
} from '~~/layers/core/app/utils/storeUrl'

const props = defineProps<{
  profile: IProfile
  stats: IProfileStats
  isOwnProfile: boolean
  isFollowing: boolean
  isFollowLoading?: boolean
}>()

// Render-time guard against javascript:/data: URLs in user-set profile links
const safeProfileUrl = computed(() => safeExternalUrl(props.profile?.profileUrl))

// Store CTA — public profile returns sellerProfile as a single object; guard for
// either shape and only surface an active store.
const store = computed(() => {
  const sp = props.profile?.sellerProfile as
    | { store_slug?: string; store_name?: string; is_active?: boolean }
    | undefined
  if (!sp?.store_slug || sp.is_active === false) return null
  return sp
})

const config = useRuntimeConfig()
const addressCopied = ref(false)

const storeAddressLabel = computed(() =>
  store.value
    ? storeDisplayUrl(
        store.value.store_slug!,
        config.public.brandDomain as string,
      )
    : '',
)

const copyStoreAddress = async () => {
  if (!store.value?.store_slug) return
  try {
    await navigator.clipboard.writeText(
      storeShareUrl(store.value.store_slug, config.public.baseURL as string),
    )
    addressCopied.value = true
    notify({ type: 'success', text: 'Store link copied!' })
    setTimeout(() => {
      addressCopied.value = false
    }, 2000)
  } catch {
    notify({ type: 'error', text: 'Could not copy link' })
  }
}

defineEmits([
  'edit',
  'settings',
  'message',
  'follow',
  'unfollow',
  'show-followers',
  'show-following',
])

const accentClass = computed(() => {
  if (props.isOwnProfile) return 'bg-brand'
  return props.profile.role === 'SELLER' ? 'bg-emerald-500' : 'bg-blue-500'
})

const formatNum = (n: number = 0) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}
</script>
