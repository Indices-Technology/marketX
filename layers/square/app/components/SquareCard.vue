<template>
  <article
    :class="[
      'group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 dark:bg-neutral-900',
      containerClasses,
      loading && 'animate-pulse',
    ]"
    :aria-busy="loading"
  >
    <!--
      Invisible routing layer.
      This lets us keep the entire card clickable WITHOUT nesting a button
      inside an anchor. Interactive elements (Follow) sit above this via z-index.
    -->
    <NuxtLink
      v-if="!loading"
      :to="squareRoute"
      class="absolute inset-0 z-0 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
      :aria-label="`View ${square.name} market square`"
    />

    <!-- ═══════════════════════════════════════════════════════════════
         COMPACT VARIANT  (w-36, rail chips)
         ═══════════════════════════════════════════════════════════════ -->
    <template v-if="variant === 'compact'">
      <div class="pointer-events-none relative">
        <!-- Banner -->
        <div class="h-14 overflow-hidden">
          <template v-if="!loading">
            <img
              v-if="bannerSrc && !bannerError"
              :src="bannerSrc"
              alt=""
              width="144"
              height="56"
              class="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
              loading="lazy"
              decoding="async"
              @error="bannerError = true"
            />
            <div
              v-else
              class="h-full w-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-900"
            />
          </template>
          <div
            v-else
            class="h-full w-full bg-neutral-200 dark:bg-neutral-800"
          />
        </div>

        <!-- Overlapping icon chip -->
        <div
          v-if="!loading"
          class="absolute bottom-0 left-2.5 flex h-8 w-8 translate-y-1/2 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow-sm dark:border-neutral-900 dark:bg-neutral-900"
        >
          <img
            v-if="iconSrc && !iconError"
            :src="iconSrc"
            alt=""
            width="32"
            height="32"
            class="h-full w-full object-cover"
            loading="lazy"
            @error="iconError = true"
          />
          <span
            v-else
            class="text-[10px] font-black leading-none text-gray-500 dark:text-neutral-400"
          >
            {{ initials }}
          </span>
        </div>
      </div>

      <!-- Meta -->
      <div class="px-2.5 pb-3 pt-6">
        <template v-if="!loading">
          <h3
            class="truncate font-display text-xs font-bold text-gray-900 dark:text-white"
          >
            {{ square.name }}
          </h3>
          <p
            class="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400 dark:text-neutral-500"
          >
            <Icon name="solar:shop-2-linear" size="10" class="shrink-0" />
            {{ formattedMemberCount }} traders
          </p>
        </template>
        <template v-else>
          <div class="h-3.5 w-20 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div
            class="mt-1.5 h-2.5 w-14 rounded bg-neutral-200 dark:bg-neutral-800"
          />
        </template>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════════════════
         SPOTLIGHT VARIANT  (w-60, home destination rail)
         ═══════════════════════════════════════════════════════════════ -->
    <template v-else-if="variant === 'spotlight'">
      <!-- Banner -->
      <div class="pointer-events-none relative h-28 overflow-hidden">
        <template v-if="!loading">
          <img
            v-if="bannerSrc && !bannerError"
            :src="bannerSrc"
            alt=""
            width="240"
            height="112"
            class="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
            loading="lazy"
            decoding="async"
            @error="bannerError = true"
          />
          <div
            v-else
            class="h-full w-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-900"
          />

          <!-- Type badge -->
          <span
            class="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm"
          >
            <Icon :name="typeIcon" size="11" />
            {{ typeLabel }}
          </span>
        </template>
        <div v-else class="h-full w-full bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <!-- Overlapping icon chip -->
      <div v-if="!loading" class="pointer-events-none relative px-3">
        <div
          class="absolute -top-5 left-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow dark:border-neutral-900 dark:bg-neutral-900"
        >
          <img
            v-if="iconSrc && !iconError"
            :src="iconSrc"
            alt=""
            width="40"
            height="40"
            class="h-full w-full object-cover"
            loading="lazy"
            @error="iconError = true"
          />
          <span
            v-else
            class="text-xs font-black text-gray-500 dark:text-neutral-400"
          >
            {{ initials }}
          </span>
        </div>
      </div>

      <!-- Meta -->
      <div class="px-3 pb-3 pt-6">
        <template v-if="!loading">
          <h3
            class="truncate font-display text-sm font-bold text-gray-900 dark:text-white"
          >
            {{ square.name }}
          </h3>
          <p
            v-if="locationString"
            class="mt-0.5 flex items-center gap-1 truncate text-[11px] text-gray-500 dark:text-neutral-400"
          >
            <Icon name="solar:map-point-linear" size="11" class="shrink-0" />
            {{ locationString }}
          </p>
          <div
            class="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-neutral-500"
          >
            <span class="flex items-center gap-1">
              <Icon name="solar:shop-2-linear" size="13" />
              {{ formattedMemberCount }} traders
            </span>
            <span v-if="square.productCount != null">
              · {{ square.productCount }} goods
            </span>
            <span
              class="ml-auto inline-flex items-center gap-1 font-semibold text-gray-700 transition-colors group-hover:text-brand dark:text-neutral-300"
            >
              Visit
              <Icon
                name="solar:arrow-right-linear"
                size="12"
                class="transition-transform duration-200 motion-safe:group-hover:translate-x-0.5"
              />
            </span>
          </div>
        </template>
        <template v-else>
          <div class="h-4 w-28 rounded bg-neutral-200 dark:bg-neutral-800" />
          <div
            class="mt-1.5 h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800"
          />
          <div
            class="mt-2 h-3 w-full rounded bg-neutral-200 dark:bg-neutral-800"
          />
        </template>
      </div>
    </template>

    <!-- ═══════════════════════════════════════════════════════════════
         FULL VARIANT  (flexible width, description + follow)
         ═══════════════════════════════════════════════════════════════ -->
    <template v-else>
      <!-- Banner -->
      <div class="pointer-events-none relative h-24 overflow-hidden">
        <template v-if="!loading">
          <img
            v-if="bannerSrc && !bannerError"
            :src="bannerSrc"
            alt=""
            width="600"
            height="96"
            class="h-full w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
            loading="lazy"
            decoding="async"
            @error="bannerError = true"
          />
          <div
            v-else
            class="h-full w-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-900"
          />

          <!-- Type badge -->
          <span
            class="absolute left-3 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm"
          >
            <Icon :name="typeIcon" size="11" />
            {{ typeLabel }}
          </span>
        </template>
        <div v-else class="h-full w-full bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <!-- Body -->
      <div class="pointer-events-none relative flex flex-col gap-2.5 p-3.5">
        <template v-if="!loading">
          <div class="flex items-start gap-3">
            <!-- Inline icon -->
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <img
                v-if="iconSrc && !iconError"
                :src="iconSrc"
                alt=""
                width="40"
                height="40"
                class="h-full w-full object-cover"
                loading="lazy"
                @error="iconError = true"
              />
              <span
                v-else
                class="text-sm font-black text-gray-500 dark:text-neutral-400"
              >
                {{ initials }}
              </span>
            </div>

            <div class="min-w-0 flex-1 pt-0.5">
              <h3
                class="truncate font-display text-sm font-bold text-gray-900 transition-colors group-hover:text-brand dark:text-white"
              >
                {{ square.name }}
              </h3>
              <p
                v-if="locationString"
                class="truncate text-[11px] text-gray-400 dark:text-neutral-500"
              >
                {{ locationString }}
              </p>
            </div>
          </div>

          <p
            v-if="square.description"
            class="line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-neutral-400"
          >
            {{ square.description }}
          </p>

          <div class="mt-auto flex items-center justify-between pt-1">
            <div
              class="flex items-center gap-3 text-[11px] text-gray-400 dark:text-neutral-500"
            >
              <span class="flex items-center gap-1">
                <Icon name="solar:shop-2-linear" size="13" />
                {{ formattedMemberCount }} traders
              </span>
              <span class="flex items-center gap-1">
                <Icon name="solar:users-group-two-rounded-linear" size="13" />
                {{ formattedFollowerCount }} following
              </span>
            </div>

            <!--
              Follow button sits ABOVE the card link via z-index and
              re-enables pointer events only for itself.
            -->
            <button
              type="button"
              class="pointer-events-auto relative z-10 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ring-1 transition-all focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 disabled:opacity-50"
              :class="followButtonClasses"
              :disabled="followLoading"
              :aria-label="
                following ? `Unfollow ${square.name}` : `Follow ${square.name}`
              "
              @click.stop="$emit('toggle-follow')"
            >
              <Icon
                v-if="followLoading"
                name="solar:refresh-linear"
                size="12"
                class="animate-spin"
              />
              <template v-else>{{
                following ? 'Following' : 'Follow'
              }}</template>
            </button>
          </div>
        </template>

        <!-- Skeleton -->
        <template v-else>
          <div class="flex items-start gap-3">
            <div
              class="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-800"
            />
            <div class="flex-1 space-y-2 pt-1">
              <div
                class="h-3.5 w-24 rounded bg-neutral-200 dark:bg-neutral-800"
              />
              <div
                class="h-2.5 w-16 rounded bg-neutral-200 dark:bg-neutral-800"
              />
            </div>
          </div>
          <div class="h-8 w-full rounded bg-neutral-200 dark:bg-neutral-800" />
          <div class="flex justify-between">
            <div class="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800" />
            <div
              class="h-6 w-16 rounded-full bg-neutral-200 dark:bg-neutral-800"
            />
          </div>
        </template>
      </div>
    </template>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { cloudinaryUrl } from '~~/layers/core/app/utils/cloudinary'

// ─── Types ─────────────────────────────────────────────────────────
export interface MarketSquare {
  id: string
  name: string
  slug: string
  description?: string | null
  bannerUrl?: string | null
  iconUrl?: string | null
  city?: string | null
  state?: string | null
  type: 'GEOGRAPHIC' | 'CATEGORY'
  memberCount?: number
  followerCount?: number
  productCount?: number
}

interface Props {
  square: MarketSquare
  variant?: 'full' | 'compact' | 'spotlight'
  following?: boolean
  followLoading?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'full',
  following: false,
  followLoading: false,
  loading: false,
})

defineEmits<{ 'toggle-follow': [] }>()

// ─── State ─────────────────────────────────────────────────────────
const bannerError = ref(false)
const iconError = ref(false)

// ─── Derived data ──────────────────────────────────────────────────
const squareRoute = computed(() => `/squares/${props.square.slug}`)

const bannerSrc = computed(() => {
  if (!props.square.bannerUrl) return null
  const dims =
    props.variant === 'compact'
      ? { width: 144, height: 56 }
      : props.variant === 'spotlight'
        ? { width: 480, height: 224 }
        : { width: 600, height: 96 }
  return cloudinaryUrl(props.square.bannerUrl, { ...dims, crop: 'fill' })
})

const iconSrc = computed(() => {
  if (!props.square.iconUrl) return null
  const size = props.variant === 'compact' ? 32 : 40
  return cloudinaryUrl(props.square.iconUrl, {
    width: size,
    height: size,
    crop: 'fill',
  })
})

const initials = computed(() => props.square.name.slice(0, 2).toUpperCase())

const locationString = computed(
  () =>
    [props.square.city, props.square.state].filter(Boolean).join(', ') || null,
)

const typeLabel = computed(() =>
  props.square.type === 'GEOGRAPHIC' ? 'Market' : 'Category',
)

const typeIcon = computed(() =>
  props.square.type === 'GEOGRAPHIC'
    ? 'solar:map-point-bold'
    : 'solar:tag-bold',
)

const formattedMemberCount = computed(() =>
  Intl.NumberFormat('en', { notation: 'compact' }).format(
    props.square.memberCount ?? 0,
  ),
)

const formattedFollowerCount = computed(() =>
  Intl.NumberFormat('en', { notation: 'compact' }).format(
    props.square.followerCount ?? 0,
  ),
)

// ─── Tailwind classes ──────────────────────────────────────────────
const containerClasses = computed(() => {
  switch (props.variant) {
    case 'compact':
      return 'w-36 shrink-0 border-gray-100 hover:border-gray-200 dark:border-neutral-800 dark:hover:border-neutral-700'
    case 'spotlight':
      return 'w-60 shrink-0 border-gray-100 hover:border-gray-200 dark:border-neutral-800 dark:hover:border-neutral-700'
    default:
      return 'border-gray-100 hover:shadow-md hover:border-gray-200 dark:border-neutral-800 dark:hover:border-neutral-700'
  }
})

const followButtonClasses = computed(() =>
  props.following
    ? 'bg-gray-100 text-gray-700 ring-gray-200 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700 dark:hover:bg-neutral-700'
    : 'bg-white text-gray-700 ring-gray-300 hover:bg-gray-900 hover:text-white hover:ring-gray-900 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-600 dark:hover:bg-neutral-100 dark:hover:text-neutral-900 dark:hover:ring-neutral-100',
)
</script>
