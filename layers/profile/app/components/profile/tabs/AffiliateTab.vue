<template>
  <div class="space-y-6 p-6">
    <!-- Loading -->
    <div v-if="isLoading && !loaded" class="py-12 text-center">
      <Icon name="eos-icons:loading" size="32" class="animate-spin text-brand" />
    </div>

    <template v-else>
      <!-- ─── NOT ENROLLED: CTA + preview of available products ────────── -->
      <template v-if="!isEnrolled">
        <div class="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-8 text-center text-white">
          <Icon name="mdi:cash-multiple" size="64" class="mx-auto mb-4" />
          <h2 class="mb-2 text-2xl font-bold">{{ $t('affiliate.joinTitle') }}</h2>
          <p class="mb-6 text-white/90">{{ $t('affiliate.joinSubtitle') }}</p>
          <button
            @click="handleEnroll"
            :disabled="isLoading"
            class="rounded-lg bg-white px-8 py-3 font-bold text-purple-600 transition-colors hover:bg-gray-100 disabled:opacity-50"
          >
            {{ $t('affiliate.enrollNow') }}
          </button>
          <p v-if="enrollMessage" class="mt-3 text-sm text-white/80">{{ enrollMessage }}</p>
        </div>

        <!-- Preview products to motivate enrollment -->
        <div
          v-if="availableProducts.length"
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-neutral-800">
            <div class="flex items-center gap-3">
              <Icon name="mdi:tag-heart-outline" size="22" class="text-purple-500" />
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-neutral-100">
                  {{ $t('affiliate.availableTitle') }}
                </h3>
                <p class="text-xs text-gray-400 dark:text-neutral-500">
                  Enroll to start sharing and earning
                </p>
              </div>
            </div>
            <span class="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              {{ availableMeta.total ?? availableProducts.length }}
            </span>
          </div>
          <div class="divide-y divide-gray-100 dark:divide-neutral-800">
            <div
              v-for="product in availableProducts.slice(0, 5)"
              :key="product.id"
              class="flex items-center gap-3 p-4"
            >
              <img
                :src="product.media?.[0]?.url || ''"
                class="h-12 w-12 shrink-0 rounded-xl bg-gray-100 object-cover dark:bg-neutral-800"
              />
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100">
                  {{ product.title }}
                </p>
                <p class="text-xs text-gray-400 dark:text-neutral-500">{{ product.seller?.store_name }}</p>
                <span class="mt-0.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  <Icon name="mdi:cash" size="11" />
                  {{ $t('affiliate.makePerSale', { amount: formatPrice(product.affiliateCommission ?? 0) }) }}
                </span>
                <p class="mt-0.5 text-[10px] text-gray-400 dark:text-neutral-500">rate set by seller · may change</p>
              </div>
              <!-- Enroll-to-copy nudge -->
              <button
                @click="handleEnroll"
                class="shrink-0 rounded-xl bg-purple-600/10 px-3 py-1.5 text-[11px] font-bold text-purple-700 transition-colors hover:bg-purple-600/20 dark:text-purple-400"
              >
                Enroll to copy
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- ─── ENROLLED DASHBOARD ──────────────────────────────────────── -->
      <template v-else>
        <!-- Overview stats -->
        <div class="grid grid-cols-3 gap-4">
          <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <Icon name="mdi:cash-check" size="24" class="mb-2 text-green-500" />
            <p class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
              {{ formatPrice(stats.totalEarnings ?? 0) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-neutral-400">{{ $t('affiliate.totalEarned') }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <Icon name="mdi:clock-outline" size="24" class="mb-2 text-amber-500" />
            <p class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
              {{ formatPrice(stats.pendingEarnings ?? 0) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-neutral-400">{{ $t('affiliate.pending') }}</p>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <Icon name="mdi:cart-check" size="24" class="mb-2 text-brand" />
            <p class="text-2xl font-bold text-gray-900 dark:text-neutral-100">
              {{ stats.totalConversions ?? 0 }}
            </p>
            <p class="text-xs text-gray-500 dark:text-neutral-400">{{ $t('affiliate.sales') }}</p>
          </div>
        </div>

        <!-- Affiliate link -->
        <div
          v-if="affiliateCode"
          class="rounded-xl border border-gray-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h3 class="mb-4 font-semibold text-gray-900 dark:text-neutral-100">{{ $t('affiliate.yourLink') }}</h3>
          <div class="flex gap-2">
            <input
              :value="affiliateLink"
              readonly
              class="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 font-mono text-sm text-gray-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100"
            />
            <button
              @click="copyLink"
              class="rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors hover:bg-[#d81b36]"
            >
              <Icon name="mdi:content-copy" size="20" />
            </button>
          </div>
        </div>

        <!-- ─── Conversion History ──────────────────────────────────────── -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-neutral-800">
            <div class="flex items-center gap-3">
              <Icon name="mdi:chart-line" size="22" class="text-brand" />
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-neutral-100">Your Conversions</h3>
                <p class="text-xs text-gray-400 dark:text-neutral-500">Orders placed via your links</p>
              </div>
            </div>
            <span
              v-if="referralsMeta.total"
              class="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-bold text-brand"
            >
              {{ referralsMeta.total }}
            </span>
          </div>

          <div v-if="loadingReferrals" class="py-8 text-center">
            <Icon name="eos-icons:loading" size="24" class="animate-spin text-gray-300" />
          </div>

          <div
            v-else-if="!referralsList.length"
            class="p-8 text-center text-gray-400 dark:text-neutral-500"
          >
            <Icon name="mdi:link-variant-off" size="40" class="mx-auto mb-2" />
            <p class="text-sm">No conversions yet</p>
            <p class="mt-1 text-xs">Share your product links and you'll see sales here</p>
          </div>

          <div v-else class="divide-y divide-gray-100 dark:divide-neutral-800">
            <div
              v-for="referral in referralsList"
              :key="referral.id"
              class="flex items-center justify-between gap-3 p-4"
            >
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-gray-900 dark:text-neutral-100">
                  {{ referral.products.map(p => p.title).join(', ') || 'Order #' + referral.id }}
                </p>
                <p class="text-xs text-gray-400 dark:text-neutral-500">
                  {{ formatDate(referral.date) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-green-600 dark:text-green-400">
                  +{{ formatKobo(referral.commission) }}
                </p>
                <span
                  class="inline-block rounded-full px-2 py-0.5 text-[10px] font-bold"
                  :class="statusClass(referral.status)"
                >
                  {{ referral.status }}
                </span>
              </div>
            </div>

            <div v-if="referralsMeta.hasMore" class="border-t border-gray-100 p-3 text-center dark:border-neutral-800">
              <button
                @click="loadMoreReferrals"
                :disabled="loadingReferrals"
                class="text-[12px] font-semibold text-brand hover:underline disabled:opacity-50"
              >
                Load more
              </button>
            </div>
          </div>
        </div>

        <!-- ─── My Products Being Affiliated (sellers only) ─────────────── -->
        <div
          v-if="hasSellers"
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-neutral-800">
            <div class="flex items-center gap-3">
              <Icon name="mdi:store-check" size="22" class="text-brand" />
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-neutral-100">{{ $t('affiliate.myProducts') }}</h3>
                <p class="text-xs text-gray-400 dark:text-neutral-500">{{ $t('affiliate.myProductsHint') }}</p>
              </div>
            </div>
            <div v-if="sellerProductStats.products.length" class="text-right">
              <p class="text-xs text-gray-400 dark:text-neutral-500">{{ $t('affiliate.totalRevenue') }}</p>
              <p class="text-sm font-bold text-gray-900 dark:text-neutral-100">
                {{ formatKobo(sellerProductStats.totalRevenue) }}
              </p>
            </div>
          </div>

          <div v-if="loadingSellerProducts" class="py-8 text-center">
            <Icon name="eos-icons:loading" size="24" class="animate-spin text-gray-300" />
          </div>

          <div
            v-else-if="!sellerProductStats.products.length"
            class="p-8 text-center text-gray-400 dark:text-neutral-500"
          >
            <Icon name="mdi:tag-off-outline" size="40" class="mx-auto mb-2" />
            <p class="text-sm">{{ $t('affiliate.noProducts') }}</p>
            <p class="mt-1 text-xs">{{ $t('affiliate.noProductsHint') }}</p>
          </div>

          <div v-else class="divide-y divide-gray-100 dark:divide-neutral-800">
            <!-- Summary row -->
            <div class="grid grid-cols-3 gap-0 border-b border-gray-100 dark:border-neutral-800">
              <div class="p-3 text-center">
                <p class="text-lg font-bold text-gray-900 dark:text-neutral-100">{{ sellerProductStats.products.length }}</p>
                <p class="text-[10px] text-gray-400 dark:text-neutral-500">{{ $t('affiliate.products') }}</p>
              </div>
              <div class="border-x border-gray-100 p-3 text-center dark:border-neutral-800">
                <p class="text-lg font-bold text-gray-900 dark:text-neutral-100">{{ sellerProductStats.totalUnitsSold }}</p>
                <p class="text-[10px] text-gray-400 dark:text-neutral-500">{{ $t('affiliate.unitsSold') }}</p>
              </div>
              <div class="p-3 text-center">
                <p class="text-lg font-bold text-green-600">{{ formatKobo(sellerProductStats.totalCommission) }}</p>
                <p class="text-[10px] text-gray-400 dark:text-neutral-500">{{ $t('affiliate.commissionOut') }}</p>
              </div>
            </div>

            <!-- Product rows -->
            <div
              v-for="product in sellerProductStats.products"
              :key="product.id"
              class="flex items-center justify-between p-4"
            >
              <div class="flex items-center gap-3">
                <img :src="product.imageUrl || ''" class="h-12 w-12 rounded-lg bg-gray-100 object-cover dark:bg-neutral-800" />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">{{ product.title }}</p>
                  <p class="text-xs text-gray-400 dark:text-neutral-500">
                    {{ product.storeName }} ·
                    <span class="text-purple-600 dark:text-purple-400">
                      {{ $t('affiliate.commission', { rate: product.affiliateCommission }) }}
                    </span>
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900 dark:text-neutral-100">{{ formatKobo(product.revenue) }}</p>
                <p class="text-xs text-gray-400 dark:text-neutral-500">{{ product.unitsSold }} sold</p>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── Promoters (sellers only) ───────────────────────────────── -->
        <div
          v-if="hasSellers"
          class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div class="flex items-center gap-3 border-b border-gray-200 p-4 dark:border-neutral-800">
            <Icon name="mdi:account-group-outline" size="22" class="text-brand" />
            <div>
              <h3 class="font-semibold text-gray-900 dark:text-neutral-100">{{ $t('affiliate.promoters') }}</h3>
              <p class="text-xs text-gray-400 dark:text-neutral-500">{{ $t('affiliate.promotersHint') }}</p>
            </div>
          </div>

          <div v-if="loadingPromoters" class="py-8 text-center">
            <Icon name="eos-icons:loading" size="24" class="animate-spin text-gray-300" />
          </div>

          <div
            v-else-if="!promoters.length"
            class="p-8 text-center text-gray-400 dark:text-neutral-500"
          >
            <Icon name="mdi:account-group-outline" size="40" class="mx-auto mb-2" />
            <p class="text-sm">{{ $t('affiliate.noPromoters') }}</p>
            <p class="mt-1 text-xs">{{ $t('affiliate.noPromotersHint') }}</p>
          </div>

          <div v-else class="divide-y divide-gray-100 dark:divide-neutral-800">
            <div
              v-for="promoter in promoters"
              :key="promoter.id"
              class="flex items-center justify-between gap-3 p-4"
            >
              <div class="flex items-center gap-3">
                <img
                  :src="promoter.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${promoter.username}`"
                  class="h-10 w-10 rounded-full bg-gray-100 object-cover dark:bg-neutral-800"
                />
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-neutral-100">@{{ promoter.username }}</p>
                  <p class="text-xs text-gray-400 dark:text-neutral-500">{{ promoter.orderCount }} sale{{ promoter.orderCount !== 1 ? 's' : '' }}</p>
                </div>
              </div>
              <p class="text-sm font-bold text-green-600 dark:text-green-400">
                {{ formatKobo(promoter.totalEarned) }} earned
              </p>
            </div>
          </div>
        </div>

        <!-- ─── Products Available to Promote ─────────────────────────── -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <div class="flex items-center justify-between border-b border-gray-200 p-4 dark:border-neutral-800">
            <div class="flex items-center gap-3">
              <Icon name="mdi:tag-heart-outline" size="22" class="text-purple-500" />
              <div>
                <h3 class="font-semibold text-gray-900 dark:text-neutral-100">{{ $t('affiliate.availableTitle') }}</h3>
                <p class="text-xs text-gray-400 dark:text-neutral-500">{{ $t('affiliate.availableHint') }}</p>
              </div>
            </div>
            <span
              v-if="availableProducts.length"
              class="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
            >
              {{ availableMeta.total ?? availableProducts.length }}
            </span>
          </div>

          <div v-if="loadingAvailable" class="py-8 text-center">
            <Icon name="eos-icons:loading" size="24" class="animate-spin text-gray-300" />
          </div>

          <div
            v-else-if="!availableProducts.length"
            class="p-8 text-center text-gray-400 dark:text-neutral-500"
          >
            <Icon name="mdi:tag-multiple-outline" size="40" class="mx-auto mb-2" />
            <p class="text-sm">{{ $t('affiliate.noAvailable') }}</p>
            <p class="mt-1 text-xs">{{ $t('affiliate.noAvailableHint') }}</p>
          </div>

          <div v-else>
            <div class="divide-y divide-gray-100 dark:divide-neutral-800">
              <div
                v-for="product in availableProducts"
                :key="product.id"
                class="flex items-center gap-3 p-4"
              >
                <img
                  :src="product.media?.[0]?.url || ''"
                  class="h-12 w-12 shrink-0 rounded-xl bg-gray-100 object-cover dark:bg-neutral-800"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-gray-900 dark:text-neutral-100">
                    {{ product.title }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-neutral-500">{{ product.seller?.store_name }}</p>
                  <span class="mt-0.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    <Icon name="mdi:cash" size="11" />
                    {{ $t('affiliate.makePerSale', { amount: formatPrice(product.affiliateCommission ?? 0) }) }}
                  </span>
                  <p class="mt-0.5 text-[10px] text-gray-400 dark:text-neutral-500">rate set by seller · may change</p>
                </div>
                <button
                  @click="copyAffiliateProductLink(product)"
                  class="shrink-0 rounded-xl bg-purple-600/10 px-3 py-1.5 text-[11px] font-bold text-purple-700 transition-colors hover:bg-purple-600/20 dark:text-purple-400"
                >
                  {{ $t('affiliate.copyLink') }}
                </button>
              </div>
            </div>

            <div v-if="availableMeta.hasMore" class="border-t border-gray-100 p-3 text-center dark:border-neutral-800">
              <button
                @click="loadMoreAvailable"
                :disabled="loadingAvailable"
                class="text-[12px] font-semibold text-brand hover:underline disabled:opacity-50"
              >
                {{ $t('affiliate.loadMore') }}
              </button>
            </div>
          </div>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '~~/layers/core/app/composables/useToast'
import { useAffiliate } from '~~/layers/commerce/app/composables/useAffiliate'
import { useSellerStore } from '~~/layers/seller/app/store/seller.store'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'
import { useAffiliateApi } from '~~/layers/commerce/app/services/affiliate.api'
import { computed, onMounted, ref } from 'vue'
import type { Promoter, Referral } from '~~/layers/commerce/app/types/affiliate'

const toast = useToast()
const sellerStore = useSellerStore()
const { formatPrice, formatKobo } = useCurrency()
const {
  isLoading,
  isEnrolled,
  affiliateCode,
  stats,
  fetchAffiliateStatus,
  enroll,
} = useAffiliate()

const enrollMessage = ref('')
const loaded = ref(false)
const loadingSellerProducts = ref(false)
const hasSellers = computed(() => sellerStore.hasSellers)

// ── Affiliate link ─────────────────────────────────────────────────────────
const affiliateLink = computed(() =>
  affiliateCode.value ? `${window.location.origin}/?ref=${affiliateCode.value}` : '',
)

// ── Referrals ──────────────────────────────────────────────────────────────
const referralsList = ref<Referral[]>([])
const loadingReferrals = ref(false)
const referralsMeta = ref<{ total?: number; hasMore?: boolean; offset?: number }>({})
const REFERRALS_LIMIT = 20

const fetchReferralsData = async (reset = false) => {
  if (reset) { referralsList.value = []; referralsMeta.value = {} }
  loadingReferrals.value = true
  try {
    const api = useAffiliateApi()
    const res: any = await api.getReferrals({
      limit: REFERRALS_LIMIT,
      offset: referralsList.value.length,
    })
    referralsList.value.push(...(res?.data?.referrals ?? []))
    referralsMeta.value = {
      total: res?.data?.total,
      hasMore: res?.data?.hasMore,
    }
  } catch { /* non-critical */ } finally {
    loadingReferrals.value = false
  }
}

const loadMoreReferrals = () => fetchReferralsData()

// ── Seller product stats ───────────────────────────────────────────────────
const sellerProductStats = ref<{
  products: any[]
  totalRevenue: number
  totalUnitsSold: number
  totalCommission: number
}>({ products: [], totalRevenue: 0, totalUnitsSold: 0, totalCommission: 0 })

const fetchSellerProductStats = async () => {
  if (!hasSellers.value) return
  loadingSellerProducts.value = true
  try {
    const api = useAffiliateApi()
    const res: any = await api.getSellerProducts()
    if (res?.data) sellerProductStats.value = res.data
  } catch { /* non-critical */ } finally {
    loadingSellerProducts.value = false
  }
}

// ── Promoters ──────────────────────────────────────────────────────────────
const promoters = ref<Promoter[]>([])
const loadingPromoters = ref(false)

const fetchPromoters = async () => {
  if (!hasSellers.value) return
  loadingPromoters.value = true
  try {
    const api = useAffiliateApi()
    const res: any = await api.getPromoters()
    promoters.value = res?.data?.promoters ?? []
  } catch { /* non-critical */ } finally {
    loadingPromoters.value = false
  }
}

// ── Available products to promote ─────────────────────────────────────────
const availableProducts = ref<any[]>([])
const loadingAvailable = ref(false)
const availableMeta = ref<{ total?: number; hasMore?: boolean; offset?: number }>({})
const AVAIL_LIMIT = 10

const fetchAvailableProducts = async (reset = false) => {
  if (reset) { availableProducts.value = []; availableMeta.value = {} }
  loadingAvailable.value = true
  try {
    const api = useAffiliateApi()
    const res: any = await api.getAvailableProducts({
      limit: AVAIL_LIMIT,
      offset: availableProducts.value.length,
    })
    availableProducts.value.push(...(res?.data ?? []))
    availableMeta.value = res?.meta ?? {}
  } catch { /* non-critical */ } finally {
    loadingAvailable.value = false
  }
}

const loadMoreAvailable = () => fetchAvailableProducts()

// ── Copy product link (auto-enroll if needed) ──────────────────────────────
const copyAffiliateProductLink = async (product: any) => {
  // If not yet enrolled, silently enroll first then copy
  if (!isEnrolled.value) {
    try {
      await enroll()
      toast.showToast("You're now enrolled! Copying your link...", 'success')
      await fetchAvailableProducts(true)
    } catch (e: any) {
      toast.showToast(e.message || 'Failed to enroll', 'error')
      return
    }
  }
  const slug = product.slug ?? ''
  const link = `${window.location.origin}/product/${slug}?ref=${affiliateCode.value}`
  navigator.clipboard.writeText(link)
  toast.showToast('Affiliate link copied!', 'success')
}

// ── Init ───────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    await fetchAffiliateStatus()
    // Always fetch available products — shown before and after enrollment
    await fetchAvailableProducts(true)
    if (isEnrolled.value) {
      await Promise.allSettled([
        fetchReferralsData(true),
        fetchSellerProductStats(),
        fetchPromoters(),
      ])
    }
  } catch { /* handled gracefully */ } finally {
    loaded.value = true
  }
})

// ── Actions ────────────────────────────────────────────────────────────────
const handleEnroll = async () => {
  try {
    await enroll()
    toast.showToast("You're now an affiliate! Start sharing links to earn.", 'success')
    await Promise.allSettled([
      fetchReferralsData(true),
      fetchSellerProductStats(),
      fetchPromoters(),
      fetchAvailableProducts(true),
    ])
  } catch (e: any) {
    toast.showToast(e.message || 'Failed to enroll', 'error')
  }
}

const copyLink = () => {
  navigator.clipboard.writeText(affiliateLink.value)
  toast.showToast('Affiliate link copied!', 'success')
}

// ── Helpers ────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

const statusClass = (status: string) => {
  const s = status?.toUpperCase()
  if (s === 'DELIVERED') return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
  if (s === 'CANCELLED' || s === 'CANCELED' || s === 'RETURNED') return 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
  return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
}
</script>
