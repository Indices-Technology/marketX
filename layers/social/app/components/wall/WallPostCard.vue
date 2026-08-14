<template>
  <div
    ref="cardRef"
    class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
  >
    <!-- Header -->
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3">
        <!-- Avatar -->
        <NuxtLink
          :to="
            post.author.role === 'seller'
              ? `/sellers/profile/${post.author.username}`
              : `/profile/${post.author.username}`
          "
          class="shrink-0"
        >
          <div
            class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-brand/10 to-violet-100 text-sm font-black text-brand dark:from-brand/20 dark:to-violet-900/30"
          >
            <img
              v-if="resolvedAvatar"
              :src="imgAvatar(resolvedAvatar)"
              class="h-full w-full object-cover"
            />
            <span v-else>{{
              post.author.username?.[0]?.toUpperCase() ?? 'U'
            }}</span>
          </div>
        </NuxtLink>

        <div>
          <div class="flex items-center gap-1.5">
            <NuxtLink
              :to="`/profile/${post.author.username}`"
              class="text-sm font-bold text-gray-900 hover:underline dark:text-neutral-100"
            >
              {{ post.author.username }}
            </NuxtLink>
            <!-- Shoutout badge -->
            <span
              v-if="post.type === 'SHOUTOUT'"
              class="flex items-center gap-0.5 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand"
            >
              <Icon name="solar:speaker-linear" size="10" />
              Shoutout
            </span>
          </div>
          <p class="text-[11px] text-gray-400 dark:text-neutral-500">
            {{ timeAgo(post.created_at) }}
          </p>
        </div>
      </div>

      <!-- Delete (owner or author) -->
      <button
        v-if="canDelete"
        class="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
        :disabled="deleting"
        @click="handleDelete"
      >
        <Icon
          v-if="deleting"
          name="eos-icons:loading"
          size="14"
          class="animate-spin"
        />
        <Icon v-else name="solar:trash-bin-trash-linear" size="16" />
      </button>
    </div>

    <!-- Body text. PostCaption (same as the main feed) both clamps long copy
         and turns @mentions / #hashtags into links — the plain <p> this
         replaced did neither, so a long post pushed the media and actions off
         screen and mentions rendered as dead text. -->
    <div
      v-if="bodyText"
      class="mt-3 text-sm leading-relaxed text-gray-700 dark:text-neutral-300"
    >
      <PostCaption
        :caption="bodyText"
        :mentions="post.mentions"
        :class="expanded ? '' : 'line-clamp-4'"
      />
      <button
        v-if="isLongBody"
        class="mt-1 text-xs font-semibold text-gray-400 transition hover:text-brand dark:text-neutral-500"
        @click.stop="expanded = !expanded"
      >
        {{ expanded ? 'Show less' : 'Show more' }}
      </button>
    </div>

    <!-- Tagged products — "shop this post". Rendered above the actions so the
         thing being sold sits with the post, not after the like button. -->
    <div v-if="taggedProducts.length" class="mt-3">
      <TaggedProductsDisplay
        :products="taggedProducts"
        :content-type="post.contentType ?? ''"
        @select-product="openTaggedProduct"
      />
    </div>

    <!-- Media — same gallery as the main feed: full images (no square crop),
         playable videos that autoplay on scroll, tap opens the full post. -->
    <div v-if="mediaItems.length" class="mt-3 overflow-hidden rounded-xl">
      <PostMediaGallery
        ref="mediaGalleryRef"
        :media-items="mediaItems"
        :post="post as any"
        :sound-enabled="soundEnabled"
        :music-playing="false"
        @click="openPost"
        @music-toggle="toggleSound"
      />
    </div>

    <!-- Actions -->
    <div
      class="mt-3 flex items-center gap-4 border-t border-gray-50 pt-3 dark:border-neutral-800"
    >
      <!-- Like -->
      <button
        class="flex items-center gap-1.5 text-xs font-semibold transition"
        :class="
          localLiked
            ? 'text-brand'
            : 'text-gray-400 hover:text-brand dark:text-neutral-500'
        "
        @click="toggleLike"
      >
        <Icon
          :name="localLiked ? 'solar:heart-bold' : 'solar:heart-linear'"
          size="16"
        />
        {{ localLikes > 0 ? localLikes : '' }}
        <span>{{ localLiked ? 'Liked' : 'Like' }}</span>
      </button>

      <!-- Comment -->
      <button
        class="flex items-center gap-1.5 text-xs font-semibold text-gray-400 transition hover:text-brand dark:text-neutral-500"
        @click="router.push(`/post/${post.id}`)"
      >
        <Icon name="solar:chat-round-linear" size="16" />
        {{ post._count.comments > 0 ? post._count.comments : '' }}
        <span>Comment</span>
      </button>

      <!-- Share — the wall card never had one, so a post on a store page was
           the only place in the app you could not pass a post along. -->
      <button
        class="ml-auto flex items-center gap-1.5 text-xs font-semibold text-gray-400 transition hover:text-brand dark:text-neutral-500"
        @click="sharePost"
      >
        <Icon name="solar:share-linear" size="16" />
        <span>Share</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute, useRuntimeConfig } from '#imports'
import { imgAvatar } from '~~/layers/core/app/utils/cloudinary'
import PostMediaGallery from '~~/layers/social/app/components/post-card/PostMediaGallery.vue'
import PostCaption from '~~/layers/social/app/components/PostCaption.vue'
import TaggedProductsDisplay from '~~/layers/social/app/components/TaggedProductsDisplay.vue'
import { useShareModal } from '~~/layers/social/app/composables/useShareModal'
import { useStorefront } from '~~/layers/seller/app/composables/useStorefront'
import { useFeedSound } from '~~/layers/feed/app/composables/useFeedSound'
import { useProfileStore } from '~~/layers/profile/app/stores/profile.store'
import {
  useWallApi,
  type WallType,
} from '~~/layers/social/app/services/wall.api'
import { usePostApi } from '~~/layers/social/app/services/post.api'
import type { IWallPost } from '~~/layers/social/app/services/wall.api'

const props = defineProps<{
  post: IWallPost
  wallType: WallType
  wallSlug: string
  isWallOwner?: boolean
  ownerAvatar?: string | null
}>()

const emit = defineEmits<{
  deleted: [postId: string]
}>()

const router = useRouter()
const route = useRoute()
const profileStore = useProfileStore()
const { storeLink } = useStorefront()
const deleting = ref(false)

// ─── Media ────────────────────────────────────────────────────────────────────
const mediaItems = computed(() => props.post.media ?? [])
const openPost = () => router.push(`/post/${props.post.id}`)

// ─── Body text ────────────────────────────────────────────────────────────────
const bodyText = computed(() => props.post.caption || props.post.content || '')
const expanded = ref(false)
// Matches the main feed's threshold in PostCardActions so a post that clamps in
// the feed also clamps here.
const isLongBody = computed(() => bodyText.value.length > 120)

// ─── Tagged products ──────────────────────────────────────────────────────────
// Flattened into the shape TaggedProductsDisplay expects (same mapping the feed
// card uses), tolerating a tag whose product row has since been removed.
// Gated on a seller author, matching PostCardActions in the main feed. On a
// store wall this also stops a customer shoutout from turning into a shop
// window for goods that are not the shopkeeper's.
const taggedProducts = computed(() =>
  (props.post.author.role === 'seller' ? props.post.taggedProducts ?? [] : [])
    .filter((t) => t.product)
    .map((t) => ({
      id: t.product!.id,
      title: t.product!.title,
      price: t.product!.price,
      slug: t.product!.slug,
      image: t.product!.media?.[0]?.url ?? null,
      averageRating: t.product!.averageRating ?? null,
      totalReviews: t.product!.totalReviews ?? 0,
      likeCount: t.product!._count?.likes ?? 0,
    })),
)

const openTaggedProduct = (id: number) => {
  const hit = taggedProducts.value.find((p) => p.id === id)
  // Prefer the slug — /product/:id also resolves, but the slug URL is the one
  // worth having in history and in the address bar if the buyer shares it.
  router.push(storeLink(`/product/${hit?.slug ?? id}`))
}

// ─── Share ────────────────────────────────────────────────────────────────────
const { openShare } = useShareModal()
const sharePost = () => {
  const base = String(useRuntimeConfig().public.baseURL || '').replace(
    /\/+$/,
    '',
  )
  openShare(
    `${base}/post/${props.post.id}`,
    bodyText.value.slice(0, 80) || `Post by ${props.post.author.username}`,
  )
}

// ─── Video autoplay-on-scroll (mirrors PostCard) ──────────────────────────────
const cardRef = ref<HTMLElement | null>(null)
const mediaGalleryRef = ref<InstanceType<typeof PostMediaGallery> | null>(null)
const videoRef = computed(() => mediaGalleryRef.value?.videoRef ?? null)
const { soundEnabled } = useFeedSound()
const toggleSound = () => {
  soundEnabled.value = !soundEnabled.value
}
let preloadObserver: IntersectionObserver | null = null
let playObserver: IntersectionObserver | null = null

watch(soundEnabled, (enabled) => {
  if (videoRef.value) videoRef.value.muted = !enabled
})

onMounted(() => {
  // Upgrade preload when the card is ~400px away so playback starts promptly.
  if (cardRef.value && mediaItems.value.length) {
    preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          mediaGalleryRef.value?.activateVideo()
          preloadObserver?.disconnect()
        }
      },
      { rootMargin: '400px 0px', threshold: 0 },
    )
    preloadObserver.observe(cardRef.value)
  }

  // Play while ≥50% visible, pause otherwise.
  if (videoRef.value) {
    videoRef.value.muted = !soundEnabled.value
    playObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (mediaGalleryRef.value?.canAutoplay !== false) {
            videoRef.value?.play().catch(() => {})
          }
        } else {
          videoRef.value?.pause()
        }
      },
      { threshold: 0.5 },
    )
    playObserver.observe(videoRef.value)
  }
})

onUnmounted(() => {
  preloadObserver?.disconnect()
  playObserver?.disconnect()
})

const localLiked = ref(props.post.viewerLiked)
const localLikes = ref(props.post._count.likes)

const resolvedAvatar = computed(
  () => props.post.author.avatar || props.ownerAvatar || null,
)

const canDelete = computed(
  () =>
    profileStore.isLoggedIn &&
    (profileStore.me?.id === props.post.author.id || props.isWallOwner),
)

const timeAgo = (date: string): string => {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(date).toLocaleDateString()
}

const toggleLike = async () => {
  // Was a bare `return` — the button looked live but did nothing at all for a
  // signed-out visitor, which is most traffic on a shared store link. Send them
  // somewhere instead, and bring them back to the post afterwards.
  if (!profileStore.isLoggedIn) {
    router.push(`/user-login?redirect=${encodeURIComponent(route.fullPath)}`)
    return
  }
  const wasLiked = localLiked.value
  localLiked.value = !wasLiked
  localLikes.value += wasLiked ? -1 : 1
  try {
    if (wasLiked) {
      await usePostApi().unlikePost(props.post.id)
    } else {
      await usePostApi().likePost(props.post.id)
    }
  } catch {
    localLiked.value = wasLiked
    localLikes.value += wasLiked ? 1 : -1
  }
}

const handleDelete = async () => {
  if (deleting.value) return
  deleting.value = true
  try {
    await useWallApi().deleteShoutout(
      props.wallType,
      props.wallSlug,
      props.post.id,
    )
    emit('deleted', props.post.id)
  } catch {
    // BaseApiClient shows toast
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
