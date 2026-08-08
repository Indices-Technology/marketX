<!-- GuestFeedPreview — the guest-only "peek" below the desktop hero. Mirrors
     deleted TrustMarketHome's old bottom section: a few real posts, then a
     sign-in CTA instead of infinite scroll. This is the ONLY place feed
     content gets truncated — SocialFeed.vue (the authenticated view) is
     never wrapped or gated this way. -->
<template>
  <div class="mx-auto w-full max-w-[600px] space-y-5 px-2 pb-16 pt-10 sm:px-0">
    <div class="mb-2 text-center">
      <p class="t-eyebrow">From the community</p>
      <h2 class="t-title">Real people, trading now</h2>
    </div>

    <div v-if="pending && !posts.length" class="space-y-4">
      <BaseSkeleton
        v-for="i in 2"
        :key="i"
        shape="block"
        height="220px"
        rounded="rounded-2xl"
      />
    </div>

    <div v-else-if="posts.length" class="space-y-4">
      <PostCard
        v-for="post in posts"
        :key="post.id"
        :post="post"
        @open-comments="selectedPost = $event"
        @open-details="selectedPost = $event"
      />

      <div class="pt-6 text-center">
        <p class="text-base font-bold text-gray-900 dark:text-white">
          This is just a peek.
        </p>
        <p
          class="mx-auto mt-1 max-w-xs text-sm text-gray-500 dark:text-neutral-400"
        >
          Sign in to see the full feed — everything happening across Nigeria's
          traders, right now.
        </p>
        <NuxtLink
          to="/user-login"
          class="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand/30 transition-colors hover:bg-brand/90"
        >
          Sign in to see more
          <Icon name="solar:arrow-right-linear" size="15" />
        </NuxtLink>
      </div>
    </div>

    <BaseEmptyState
      v-else
      icon="solar:chat-round-line-linear"
      title="The market is quiet right now"
      description="Check back soon, or sign in to follow traders and markets."
      compact
    />

    <PostDetailModal
      v-if="selectedPost"
      :post="selectedPost"
      @close="selectedPost = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PostCard from '~~/layers/social/app/components/PostCard.vue'
import PostDetailModal from '~~/layers/social/app/components/modals/PostDetailModal.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import { useFeedApi } from '~~/layers/feed/app/services/feed.api'
import type { IFeedItem } from '~~/layers/feed/app/types/feed.types'

defineOptions({ name: 'GuestFeedPreview' })

const pending = ref(true)
const posts = ref<IFeedItem[]>([])
const selectedPost = ref<IFeedItem | null>(null)

onMounted(async () => {
  try {
    const res = await useFeedApi().getHomeFeed({ limit: 15 })
    posts.value = (res.items ?? []).filter((i) => i.type === 'POST').slice(0, 5)
  } catch {
    posts.value = []
  } finally {
    pending.value = false
  }
})
</script>
