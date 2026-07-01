<template>
  <NuxtLink
    :to="`/squares/${square.slug}`"
    class="group relative block overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-md dark:bg-neutral-900"
    :class="variant === 'compact' ? 'w-36 shrink-0' : 'flex flex-col'"
    :style="`border-color: ${accent}44`"
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
            class="h-full w-full"
            :style="`background: linear-gradient(135deg, ${accent}55, ${accent}22)`"
          />
          <!-- Bottom gradient scrim -->
          <div
            class="pointer-events-none absolute inset-x-0 bottom-0 h-8"
            :style="`background: linear-gradient(to top, ${accent}55, transparent)`"
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
            class="text-[10px] font-black leading-none"
            :style="`color: ${accent}`"
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
          <Icon name="mdi:store-outline" size="10" class="shrink-0" />
          {{ square.memberCount ?? 0 }} sellers
        </p>
      </div>
    </template>

    <!-- ── FULL LAYOUT ─────────────────────────────────────────────────────── -->
    <template v-else>
      <!-- Accent left stripe -->
      <div
        class="absolute inset-y-0 left-0 z-10 w-[3px] rounded-l-2xl"
        :style="`background: ${accent}`"
      />

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
          class="h-full w-full transition-transform duration-500 group-hover:scale-105"
          :style="`background: linear-gradient(135deg, ${accent}44, ${accent}18)`"
        />
        <div
          class="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
          :style="`background: linear-gradient(to top, ${accent}44, transparent)`"
        />
        <span
          class="absolute left-3 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm"
        >
          <Icon
            :name="square.type === 'GEOGRAPHIC' ? 'mdi:map-marker' : 'mdi:tag'"
            size="11"
          />
          {{ square.type === 'GEOGRAPHIC' ? 'Location' : 'Category' }}
        </span>
      </div>

      <!-- Body -->
      <div class="flex flex-1 flex-col gap-2 p-3.5 pl-5">
        <div class="flex items-start gap-2.5">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-white shadow-sm dark:bg-neutral-900"
            :style="`border-color: ${accent}55`"
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
            <span v-else class="text-sm font-black" :style="`color: ${accent}`">
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
              <Icon name="mdi:store-outline" size="13" />
              {{ square.memberCount ?? 0 }} sellers
            </span>
            <span class="flex items-center gap-1">
              <Icon name="mdi:account-multiple-outline" size="13" />
              {{ square.followerCount ?? 0 }} following
            </span>
          </div>
          <button
            class="rounded-full px-3 py-1 text-[11px] font-bold transition-all"
            :class="
              following
                ? 'bg-amber-50 text-amber-600 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-700/40'
                : 'text-amber-600 ring-1 ring-amber-300 hover:bg-amber-500 hover:text-white hover:ring-amber-500 dark:text-amber-400 dark:ring-amber-700/50'
            "
            :disabled="followLoading"
            @click.prevent="$emit('toggle-follow')"
          >
            <Icon
              v-if="followLoading"
              name="mdi:loading"
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
import { computed } from 'vue'
import { cloudinaryUrl } from '~~/layers/core/app/utils/cloudinary'

const props = withDefaults(
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
    }
    variant?: 'full' | 'compact'
    following?: boolean
    followLoading?: boolean
  }>(),
  { variant: 'full' },
)

defineEmits<{ 'toggle-follow': [] }>()

const accent = computed(() => props.square.accentColor || '#f59e0b')
</script>
