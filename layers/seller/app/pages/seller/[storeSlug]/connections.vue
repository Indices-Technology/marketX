<template>
  <div class="px-3 py-4 sm:px-6">
    <!-- Header -->
    <div class="mb-2 flex items-center gap-3">
      <NuxtLink
        :to="`/seller/${storeSlug}/settings`"
        class="text-gray-500 hover:text-gray-700 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        <Icon name="solar:arrow-left-linear" size="20" />
      </NuxtLink>
      <div>
        <h1
          class="font-display text-2xl font-bold text-gray-900 dark:text-neutral-100"
        >
          Connected accounts
        </h1>
        <p class="text-sm text-gray-400 dark:text-neutral-500">
          Let MarketX post your product cards to your socials and import your
          posts.
        </p>
      </div>
    </div>

    <!-- Login-vs-connection clarifier — this is separate from how you sign in. -->
    <p
      class="mb-6 max-w-2xl rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 dark:bg-neutral-800/60 dark:text-neutral-400"
    >
      Connecting an account is separate from signing in. It grants MarketX
      permission to post on your behalf — you can disconnect any time.
    </p>

    <div class="max-w-2xl space-y-2">
      <div
        v-for="p in platforms"
        :key="p.id"
        class="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-neutral-800"
      >
        <div class="flex min-w-0 items-center gap-3">
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            :class="p.iconBg"
          >
            <Icon :name="p.icon" size="22" :class="p.iconColor" />
          </span>
          <div class="min-w-0">
            <p class="font-semibold text-gray-900 dark:text-neutral-100">
              {{ p.name }}
            </p>
            <p class="truncate text-xs text-gray-400 dark:text-neutral-500">
              <template v-if="p.connection">
                Connected{{
                  p.connection.displayName
                    ? ` as ${p.connection.displayName}`
                    : ''
                }}
              </template>
              <template v-else-if="p.available">{{ p.blurb }}</template>
              <template v-else>Coming soon</template>
            </p>
          </div>
        </div>

        <!-- Connected → disconnect -->
        <div v-if="p.connection" class="flex items-center gap-2">
          <span class="flex items-center gap-1 text-xs font-semibold text-mint">
            <span class="h-2 w-2 rounded-full bg-mint" />
            Connected
          </span>
          <BaseButton
            variant="ghost"
            size="sm"
            @click="onDisconnect(p.connection.id)"
          >
            Disconnect
          </BaseButton>
        </div>

        <!-- Available but not connected → brand-specific OAuth button -->
        <button
          v-else-if="p.available"
          type="button"
          class="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          :disabled="connecting"
          @click="onConnect(p.id)"
        >
          Connect
        </button>

        <!-- Not yet available -->
        <span
          v-else
          class="text-xs font-medium text-gray-400 dark:text-neutral-600"
        >
          Coming soon
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { notify } from '@kyvg/vue3-notification'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import { useConnections } from '~~/layers/growth/app/composables/useConnections'

definePageMeta({ middleware: 'auth', layout: 'store-layout' })

const route = useRoute()
const router = useRouter()
const storeSlug = computed(() => route.params.storeSlug as string)

const {
  connections,
  connecting,
  refresh,
  forPlatform,
  connectTikTok,
  connectGoogleBusiness,
  disconnect,
} = useConnections()

const platforms = computed(() => [
  {
    id: 'TIKTOK' as const,
    name: 'TikTok',
    icon: 'ic:baseline-tiktok',
    iconBg: 'bg-black',
    iconColor: 'text-white',
    available: true,
    blurb: 'Post cards to your inbox and import your videos',
    connection: forPlatform('TIKTOK'),
  },
  {
    id: 'GOOGLE_GBP' as const,
    name: 'Google Business Profile',
    icon: 'logos:google-icon',
    iconBg: 'bg-gray-50 dark:bg-neutral-800',
    iconColor: '',
    available: true,
    blurb: 'Sync your reviews and post offers to your Google listing',
    connection: forPlatform('GOOGLE_GBP'),
  },
  {
    id: 'META_FB' as const,
    name: 'Facebook',
    icon: 'mdi:facebook',
    iconBg: 'bg-[#1877F2]/10',
    iconColor: 'text-[#1877F2]',
    available: false,
    blurb: '',
    connection: forPlatform('META_FB'),
  },
  {
    id: 'META_IG' as const,
    name: 'Instagram',
    icon: 'mdi:instagram',
    iconBg: 'bg-brand/10',
    iconColor: 'text-brand',
    available: false,
    blurb: '',
    connection: forPlatform('META_IG'),
  },
])
// `connections` drives `forPlatform`; reference it so the computed stays reactive.
void connections

function onConnect(platform: string) {
  const back = `/seller/${storeSlug.value}/connections`
  if (platform === 'TIKTOK') {
    connectTikTok(back)
  } else if (platform === 'GOOGLE_GBP') {
    connectGoogleBusiness(back)
  }
}

async function onDisconnect(id: string) {
  await disconnect(id)
  notify({ type: 'success', text: 'Disconnected' })
}

onMounted(async () => {
  // Handle the OAuth return, then clean the query out of the URL. Each provider
  // redirects back with `?<provider>=connected|error` + an optional `reason`.
  const returns: Array<{ key: 'tiktok' | 'google'; label: string }> = [
    { key: 'tiktok', label: 'TikTok' },
    { key: 'google', label: 'Google Business Profile' },
  ]
  let handled = false
  for (const { key, label } of returns) {
    const result = route.query[key]
    if (result === 'connected') {
      notify({ type: 'success', text: `${label} connected` })
      handled = true
    } else if (result === 'error') {
      notify({
        type: 'error',
        text: `Couldn't connect ${label}${route.query.reason ? `: ${route.query.reason}` : ''}`,
      })
      handled = true
    }
  }
  if (handled) router.replace(`/seller/${storeSlug.value}/connections`)

  await refresh()
})
</script>
