<!--
  /verify — the buyer-facing "check any seller" landing (the Verify door).

  Answers "is this seller safe to pay?" for anyone a buyer found on WhatsApp,
  Instagram, or here. Three honest states:
    verified   → we can vouch: identity + real evidence. Full trust profile.
    unverified → on MarketX, hasn't completed verification. Limited signal.
    unknown    → no record. We do NOT imply safety; we offer to invite them and
                 explain protected payment instead.

  Guest-usable, standalone (works straight from a QR scan or pasted link).
-->
<template>
  <div class="min-h-screen bg-gray-50 px-4 py-10 dark:bg-neutral-950">
    <div class="mx-auto max-w-lg">
      <!-- Top bar -->
      <div class="mb-8 flex items-center justify-between">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition hover:text-brand dark:text-neutral-400"
        >
          <Icon name="solar:alt-arrow-left-linear" size="16" />
          Home
        </NuxtLink>
        <BrandLogo variant="mark" class="h-6 w-auto" />
      </div>

      <!-- Heading -->
      <h1 class="font-display text-2xl font-bold text-gray-900 dark:text-white">
        Verify a seller
      </h1>
      <p class="mt-1 text-[15px] text-gray-500 dark:text-neutral-400">
        Check any seller — on MarketX or not — before you pay.
      </p>

      <!-- Input -->
      <form
        class="mt-5 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/10 dark:border-neutral-800 dark:bg-neutral-900"
        @submit.prevent="run"
      >
        <Icon
          name="solar:shield-user-linear"
          size="20"
          class="ml-2 shrink-0 text-mint"
        />
        <label class="sr-only" for="verify-input"
          >Seller's phone, handle or link</label
        >
        <input
          id="verify-input"
          v-model="input"
          type="text"
          autocomplete="off"
          placeholder="Phone, @instagram_handle or shop link…"
          class="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white dark:placeholder:text-neutral-500"
        />
        <BaseButton
          variant="success"
          size="sm"
          type="submit"
          :loading="loading"
        >
          Verify
        </BaseButton>
      </form>

      <!-- ── Results ─────────────────────────────────────────────────────── -->
      <div class="mt-6">
        <!-- Loading -->
        <div
          v-if="loading"
          class="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <Icon
            name="solar:refresh-linear"
            size="20"
            class="animate-spin text-gray-400"
          />
          <span class="text-sm text-gray-500 dark:text-neutral-400"
            >Checking “{{ input.trim() }}”…</span
          >
        </div>

        <!-- Error -->
        <div
          v-else-if="error"
          class="rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400"
        >
          Couldn’t complete the check. Please try again.
        </div>

        <!-- VERIFIED — we can vouch -->
        <div
          v-else-if="result?.status === 'verified' && result.seller"
          class="overflow-hidden rounded-2xl border border-mint/30 bg-white dark:border-mint/20 dark:bg-neutral-900"
        >
          <div
            class="flex items-center gap-2 bg-mint/10 px-5 py-2.5 dark:bg-mint/10"
          >
            <Icon
              name="solar:shield-check-bold"
              size="16"
              class="text-mint-dark dark:text-mint"
            />
            <span class="text-[13px] font-bold text-mint-dark dark:text-mint">
              Verified on MarketX
            </span>
          </div>
          <div class="p-5">
            <div class="flex items-center gap-3">
              <StoreAvatar
                :store-name="result.seller.store_name ?? undefined"
                :logo="result.seller.store_logo ?? undefined"
                size="lg"
              />
              <div class="min-w-0 flex-1">
                <p
                  class="flex items-center gap-1 font-display text-base font-bold text-gray-900 dark:text-white"
                >
                  <span class="truncate">{{ sellerName }}</span>
                  <Icon
                    v-if="result.seller.is_verified"
                    name="solar:verified-check-bold"
                    size="15"
                    class="shrink-0 text-blue-500"
                  />
                </p>
                <p
                  v-if="result.seller.publicId"
                  class="font-mono text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-neutral-500"
                >
                  {{ result.seller.publicId }}
                </p>
              </div>
            </div>

            <p class="mt-3 text-sm text-gray-600 dark:text-neutral-300">
              {{ result.seller.headline }}
            </p>

            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-if="matchLabel"
                class="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <Icon name="solar:check-read-linear" size="12" />
                {{ matchLabel }}
              </span>
              <span
                v-if="result.seller.cac_verified"
                class="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <Icon name="solar:document-text-linear" size="12" />
                CAC registered
              </span>
              <span
                v-if="result.seller.store_location"
                class="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <Icon name="solar:map-point-linear" size="12" />
                {{ result.seller.store_location }}
              </span>
            </div>

            <div class="mt-5 flex flex-col gap-2 sm:flex-row">
              <BaseButton
                variant="primary"
                size="md"
                class="flex-1"
                @click="goProfile(result.seller.store_slug, 'trust')"
              >
                <Icon name="solar:shield-check-bold" size="15" />
                View full trust profile
              </BaseButton>
              <BaseButton
                variant="secondary"
                size="md"
                class="flex-1"
                @click="goProfile(result.seller.store_slug)"
              >
                Visit store
              </BaseButton>
            </div>
          </div>
        </div>

        <!-- UNVERIFIED — on MarketX, but not vouched-for -->
        <div
          v-else-if="result?.status === 'unverified' && result.seller"
          class="overflow-hidden rounded-2xl border border-amber-200 bg-white dark:border-amber-500/20 dark:bg-neutral-900"
        >
          <div
            class="flex items-center gap-2 bg-amber-50 px-5 py-2.5 dark:bg-amber-500/10"
          >
            <Icon
              name="solar:info-circle-bold"
              size="16"
              class="text-amber-600 dark:text-amber-400"
            />
            <span
              class="text-[13px] font-bold text-amber-700 dark:text-amber-400"
            >
              On MarketX — not yet verified
            </span>
          </div>
          <div class="p-5">
            <div class="flex items-center gap-3">
              <StoreAvatar
                :store-name="result.seller.store_name ?? undefined"
                :logo="result.seller.store_logo ?? undefined"
                size="lg"
              />
              <div class="min-w-0 flex-1">
                <p
                  class="truncate font-display text-base font-bold text-gray-900 dark:text-white"
                >
                  {{ sellerName }}
                </p>
                <p class="text-[13px] text-gray-500 dark:text-neutral-400">
                  {{ result.seller.headline }}
                </p>
              </div>
            </div>
            <div v-if="matchLabel" class="mt-3">
              <span
                class="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:bg-neutral-800 dark:text-neutral-300"
              >
                <Icon name="solar:check-read-linear" size="12" />
                {{ matchLabel }}
              </span>
            </div>
            <p
              class="mt-3 rounded-xl bg-gray-50 px-3 py-2.5 text-[13px] text-gray-600 dark:bg-neutral-800/60 dark:text-neutral-300"
            >
              This seller is on MarketX but hasn’t completed verification yet.
              You can still pay them through protected escrow — your money is
              held until you confirm your order.
            </p>
            <div class="mt-4 flex flex-col gap-2 sm:flex-row">
              <BaseButton
                variant="primary"
                size="md"
                class="flex-1"
                @click="goProfile(result.seller.store_slug)"
              >
                Visit store
              </BaseButton>
              <NuxtLink
                to="/trust/how-it-works"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-brand/40 hover:text-brand dark:border-neutral-700 dark:text-neutral-200"
              >
                How protection works
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- UNKNOWN — no record. No reassurance; invite + educate. -->
        <div
          v-else-if="result?.status === 'unknown'"
          class="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div
            class="flex items-center gap-2 bg-gray-100 px-5 py-2.5 dark:bg-neutral-800"
          >
            <Icon
              name="solar:shield-cross-bold"
              size="16"
              class="text-gray-500 dark:text-neutral-400"
            />
            <span
              class="text-[13px] font-bold text-gray-700 dark:text-neutral-300"
            >
              No trust record on MarketX
            </span>
          </div>
          <div class="p-5">
            <p class="text-sm text-gray-600 dark:text-neutral-300">
              We couldn’t find
              <span class="font-semibold text-gray-900 dark:text-white"
                >“{{ result.query }}”</span
              >
              on MarketX. That doesn’t mean they’re unsafe — but it means
              <span class="font-semibold">we can’t vouch for them.</span> Never
              send money to a seller you can’t verify.
            </p>

            <div class="mt-4 space-y-3">
              <div class="flex items-start gap-2.5">
                <Icon
                  name="solar:shield-check-linear"
                  size="18"
                  class="mt-0.5 shrink-0 text-mint"
                />
                <p class="text-[13px] text-gray-600 dark:text-neutral-300">
                  <span class="font-semibold text-gray-900 dark:text-white"
                    >Ask them to get verified.</span
                  >
                  Sellers with a MarketX Trust Card can be checked in one tap.
                </p>
              </div>
              <div class="flex items-start gap-2.5">
                <Icon
                  name="solar:lock-keyhole-minimalistic-linear"
                  size="18"
                  class="mt-0.5 shrink-0 text-mint"
                />
                <p class="text-[13px] text-gray-600 dark:text-neutral-300">
                  <span class="font-semibold text-gray-900 dark:text-white"
                    >Pay protected.</span
                  >
                  Escrow holds your money until you get what you paid for.
                </p>
              </div>
            </div>

            <div class="mt-5 flex flex-col gap-2 sm:flex-row">
              <BaseButton
                variant="primary"
                size="md"
                class="flex-1"
                @click="invite"
              >
                <Icon
                  :name="
                    copied ? 'solar:check-circle-bold' : 'solar:share-linear'
                  "
                  size="15"
                />
                {{ copied ? 'Invite copied' : 'Invite them to get verified' }}
              </BaseButton>
              <NuxtLink
                to="/trust/how-it-works"
                class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-brand/40 hover:text-brand dark:border-neutral-700 dark:text-neutral-200"
              >
                How protection works
              </NuxtLink>
            </div>

            <p class="mt-4 text-[11px] text-gray-400 dark:text-neutral-500">
              Scam-report screening is coming soon — for now, absence of a
              record is not a safety rating.
            </p>
          </div>
        </div>

        <!-- Idle hint (no query yet) -->
        <p
          v-else
          class="rounded-2xl border border-dashed border-gray-200 px-5 py-8 text-center text-sm text-gray-400 dark:border-neutral-800 dark:text-neutral-500"
        >
          Paste a seller’s phone, Instagram handle, or link above to check them.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter, navigateTo, computed } from '#imports'

import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BrandLogo from '~~/layers/ui/app/components/BrandLogo.vue'
import StoreAvatar from '~~/layers/profile/app/components/StoreAvatar.vue'
import { useReputationApi } from '~~/layers/reputation/app/services/reputation.api'

defineOptions({ name: 'VerifyPage' })

interface VerifySeller {
  store_slug: string
  store_name: string | null
  store_logo: string | null
  store_location: string | null
  publicId: string | null
  is_verified: boolean
  cac_verified: boolean
  enoughEvidence: boolean
  tier: string | null
  headline: string
}
type MatchedBy = 'link' | 'id' | 'phone' | 'handle'
interface VerifyResult {
  status: 'verified' | 'unverified' | 'unknown'
  query: string
  matchedBy?: MatchedBy
  seller?: VerifySeller
}

const MATCH_LABELS: Record<MatchedBy, string> = {
  link: 'Matched by their MarketX link',
  id: 'Matched by Seller ID',
  phone: 'Matched by phone',
  handle: 'Matched by social handle',
}

const route = useRoute()
const router = useRouter()
const api = useReputationApi()

const input = ref(String(route.query.q ?? ''))
const loading = ref(false)
const error = ref(false)
const result = ref<VerifyResult | null>(null)
const copied = ref(false)

const sellerName = computed(
  () =>
    result.value?.seller?.store_name ||
    result.value?.seller?.store_slug ||
    'Seller',
)

const matchLabel = computed(() =>
  result.value?.matchedBy ? MATCH_LABELS[result.value.matchedBy] : '',
)

async function run() {
  const q = input.value.trim()
  if (!q) return
  // Reflect the query in the URL so a check is shareable / reloadable.
  if (String(route.query.q ?? '') !== q) router.replace({ query: { q } })
  loading.value = true
  error.value = false
  result.value = null
  try {
    const res = (await api.verify(q)) as {
      success?: boolean
      data?: VerifyResult
    }
    if (res?.success && res.data) result.value = res.data
    else error.value = true
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

function goProfile(slug: string, tab?: string) {
  return navigateTo(
    tab ? `/sellers/profile/${slug}?tab=${tab}` : `/sellers/profile/${slug}`,
  )
}

async function invite() {
  if (!import.meta.client) return
  const url = `${location.origin}/sellers/create`
  const text = `Get verified on MarketX so buyers can pay you safely: ${url}`
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Get verified on MarketX', text, url })
    } else {
      await navigator.clipboard.writeText(text)
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
    }
  } catch {
    /* user dismissed the share sheet — ignore */
  }
}

onMounted(() => {
  if (input.value.trim()) run()
})

// Support in-page navigation (e.g. changing ?q= from elsewhere).
watch(
  () => route.query.q,
  (q) => {
    const s = String(q ?? '')
    if (s && s !== input.value) {
      input.value = s
      run()
    }
  },
)
</script>
