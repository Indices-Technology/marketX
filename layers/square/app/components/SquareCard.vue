<template>
  <NuxtLink
    :to="`/squares/${square.slug}`"
    class="group relative block overflow-hidden rounded-2xl border border-gray-100 bg-white transition-all hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900"
    :class="[
      variant === 'compact' ? 'w-36 shrink-0' : '',
      variant === 'spotlight' ? 'w-60 shrink-0' : '',
    ]"
  >
    <!-- ── COMPACT LAYOUT ──────────────────────────────────────────────────── -->
    <template v-if="variant === 'compact'">
      <!-- Banner + icon chip wrapper -->
      <div class="relative">
        <!-- Banner (overflow-hidden clips only the image) -->
        <div class="h-14 overflow-hidden">
          <img
            v-if="square.bannerUrl"
            :src="
              cloudinaryUrl(square.bannerUrl, {
                width: 144,
                height: 56,
                crop: 'fill',
              })
            "
            :alt="square.name"
            width="144"
            height="56"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          <div
            v-else
            class="h-full w-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-900"
          />
        </div>
        <!-- Icon chip straddles the banner/body seam -->
        <div
          class="absolute bottom-0 left-2.5 flex h-8 w-8 translate-y-1/2 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow dark:border-neutral-900 dark:bg-neutral-900"
        >
          <img
            v-if="square.iconUrl"
            :src="
              cloudinaryUrl(square.iconUrl, {
                width: 32,
                height: 32,
                crop: 'fill',
              })
            "
            :alt="square.name"
            width="32"
            height="32"
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <span
            v-else
            class="text-[10px] font-black leading-none text-gray-500 dark:text-neutral-400"
          >
            {{ square.name.slice(0, 2).toUpperCase() }}
          </span>
        </div>
      </div>
      <!-- Info -->
      <div class="pb-3 pl-2.5 pr-2 pt-6">
        <p
          class="truncate font-display text-[12px] font-bold text-gray-900 dark:text-white"
        >
          {{ square.name }}
        </p>
        <p
          class="mt-0.5 flex items-center gap-1 text-[10px] text-gray-400 dark:text-neutral-500"
        >
          <Icon name="solar:shop-2-linear" size="10" class="shrink-0" />
          {{ square.memberCount ?? 0 }} traders
        </p>
      </div>
    </template>

    <!-- ── SPOTLIGHT LAYOUT (home destination rail) ────────────────────────── -->
    <template v-else-if="variant === 'spotlight'">
      <!-- Banner -->
      <div class="relative h-28 overflow-hidden">
        <img
          v-if="square.bannerUrl"
          :src="
            cloudinaryUrl(square.bannerUrl, {
              width: 480,
              height: 224,
              crop: 'fill',
            })
          "
          :alt="square.name"
          width="240"
          height="112"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div
          v-else
          class="h-full w-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-neutral-800 dark:to-neutral-900"
        />
        <!-- Type badge -->
        <span
          class="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm"
        >
          <Icon
            :name="square.type === 'GEOGRAPHIC' ? 'solar:map-point-bold' : 'solar:tag-bold'"
            size="11"
          />
          {{ square.type === 'GEOGRAPHIC' ? 'Market' : 'Category' }}
        </span>
      </div>

      <!-- Icon chip straddles the banner/body seam -->
      <div class="relative px-3">
        <div
          class="absolute -top-5 left-3 flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border-2 border-white bg-white shadow dark:border-neutral-900 dark:bg-neutral-900"
        >
          <img
            v-if="square.iconUrl"
            :src="
              cloudinaryUrl(square.iconUrl, {
                width: 40,
                height: 40,
                crop: 'fill',
              })
            "
            :alt="square.name"
            width="40"
            height="40"
            class="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          <span
            v-else
            class="text-xs font-black text-gray-500 dark:text-neutral-400"
          >
            {{ square.name.slice(0, 2).toUpperCase() }}
          </span>
        </div>
      </div>

      <!-- Info -->
      <div class="px-3 pb-3 pt-6">
        <p
          class="truncate font-display text-sm font-bold text-gray-900 dark:text-white"
        >
          {{ square.name }}
        </p>
        <p
          v-if="square.city || square.state"
          class="mt-0.5 flex items-center gap-1 truncate text-[11px] text-gray-500 dark:text-neutral-400"
        >
          <Icon name="solar:map-point-linear" size="11" class="shrink-0" />
          {{ [square.city, square.state].filter(Boolean).join(', ') }}
        </p>
        <div
          class="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-neutral-500"
        >
          <span class="flex items-center gap-1">
            <Icon name="solar:shop-2-linear" size="13" />
            {{ square.memberCount ?? 0 }} traders
          </span>
          <span v-if="square.productCount != null">
            · {{ square.productCount }} goods
          </span>
          <span class="ml-auto inline-flex items-center gap-1">
            Visit <Icon name="solar:arrow-right-linear" size="12" />
          </span>
        </div>
      </div>
    </template>

    <!-- ── FULL LAYOUT ─────────────────────────────────────────────────────── -->
    <template v-else>
      <!-- Banner -->
      <div class="relative h-24 overflow-hidden">
        <img
          v-if="square.bannerUrl"
          :src="
            cloudinaryUrl(square.bannerUrl, {
              width: 600,
              height: 96,
              crop: 'fill',
            })
          "
          :alt="square.name"
          width="600"
          height="96"
          class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div
          v-else
          class="h-full w-full bg-gradient-to-br from-gray-100 to-gray-50 transition-transform duration-500 group-hover:scale-105 dark:from-neutral-800 dark:to-neutral-900"
        />
        <span
          class="absolute left-3 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm"
        >
          <Icon
            :name="square.type === 'GEOGRAPHIC' ? 'solar:map-point-bold' : 'solar:tag-bold'"
            size="11"
          />
          {{ square.type === 'GEOGRAPHIC' ? 'Location' : 'Category' }}
        </span>
      </div>

      <!-- Body -->
      <div class="flex flex-col gap-2 p-3.5">
        <div class="flex items-start gap-2.5">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
          >
            <img
              v-if="square.iconUrl"
              :src="
                cloudinaryUrl(square.iconUrl, {
                  width: 40,
                  height: 40,
                  crop: 'fill',
                })
              "
              :alt="square.name"
              width="40"
              height="40"
              class="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
            <span
              v-else
              class="text-sm font-black text-gray-500 dark:text-neutral-400"
            >
              {{ square.name.slice(0, 2).toUpperCase() }}
            </span>
          </div>
          <div class="min-w-0 flex-1 pt-0.5">
            <p
              class="truncate font-display text-sm font-bold text-gray-900 dark:text-white"
            >
              {{ square.name }}
            </p>
            <p
              v-if="square.city || square.state"
              class="truncate text-[11px] text-gray-400 dark:text-neutral-500"
            >
              {{ [square.city, square.state].filter(Boolean).join(', ') }}
            </p>
          </div>
        </div>

        <p
          v-if="square.description"
          class="line-clamp-2 text-[12px] leading-relaxed text-gray-500 dark:text-neutral-400"
        >
          {{ square.description }}
        </p>

        <div class="mt-auto flex items-center justify-between pt-1">
          <div
            class="flex items-center gap-3 text-[11px] text-gray-400 dark:text-neutral-500"
          >
            <span class="flex items-center gap-1">
              <Icon name="solar:shop-2-linear" size="13" />
              {{ square.memberCount ?? 0 }} traders
            </span>
            <span class="flex items-center gap-1">
              <Icon name="solar:users-group-two-rounded-linear" size="13" />
              {{ square.followerCount ?? 0 }} following
            </span>
          </div>
          <button
            class="rounded-full px-3 py-1 text-[11px] font-bold ring-1 transition-all"
            :class="
              following
                ? 'bg-gray-100 text-gray-700 ring-gray-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700'
                : 'text-gray-700 ring-gray-300 hover:bg-gray-900 hover:text-white hover:ring-gray-900 dark:text-neutral-300 dark:ring-neutral-600 dark:hover:bg-neutral-100 dark:hover:text-neutral-900 dark:hover:ring-neutral-100'
            "
            :disabled="followLoading"
            @click.prevent="$emit('toggle-follow')"
          >
            <Icon
              v-if="followLoading"
              name="solar:refresh-linear"
              size="12"
              class="animate-spin"
            />
            <template v-else>{{ following ? 'Following' : 'Follow' }}</template>
          </button>
        </div>
      </div>
    </template>
  </NuxtLink>
</template>

<script setup lang="ts">
import { cloudinaryUrl } from '~~/layers/core/app/utils/cloudinary'

withDefaults(
  defineProps<{
    square: {
      id: string
      name: string
      slug: string
      description?: string | null
      bannerUrl?: string | null
      iconUrl?: string | null
      accentColor?: string | null
      city?: string | null
      state?: string | null
      type: 'GEOGRAPHIC' | 'CATEGORY'
      memberCount?: number
      followerCount?: number
      productCount?: number
    }
    variant?: 'full' | 'compact' | 'spotlight'
    following?: boolean
    followLoading?: boolean
  }>(),
  { variant: 'full' },
)

defineEmits<{ 'toggle-follow': [] }>()
</script>
