<template>
  <BaseModal
    :model-value="true"
    title="Respond with a product"
    max-width="md"
    @update:model-value="(v) => !v && emit('close')"
  >
    <div class="space-y-3">
      <p class="text-[13px] text-gray-500 dark:text-neutral-400">
        Pick one of your products to offer this buyer, or quickly add a new one.
      </p>

      <BaseInput
        v-model="search"
        placeholder="Search your products…"
        icon-left="solar:magnifer-linear"
      />

      <!-- Loading -->
      <div v-if="loading" class="space-y-2">
        <BaseSkeleton v-for="i in 4" :key="i" shape="block" height="64px" />
      </div>

      <!-- Empty -->
      <BaseEmptyState
        v-else-if="!filtered.length"
        icon="solar:box-bold"
        title="No products to offer"
        :description="search ? 'No products match your search.' : 'Add a product to respond to this buyer.'"
        compact
      />

      <!-- Product list -->
      <div v-else class="max-h-[46vh] space-y-2 overflow-y-auto">
        <button
          v-for="p in filtered"
          :key="p.id"
          type="button"
          class="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white p-2.5 text-left transition-colors hover:border-brand/40 hover:bg-brand/5 disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-brand/10"
          :disabled="submittingId === p.id"
          @click="pick(p)"
        >
          <img
            v-if="thumb(p)"
            :src="thumb(p)"
            :alt="p.title"
            class="h-12 w-12 shrink-0 rounded-lg object-cover"
            loading="lazy"
          />
          <div v-else class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-neutral-800">
            <Icon name="solar:bag-4-linear" size="18" class="text-gray-400" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="line-clamp-1 text-[13px] font-semibold text-gray-900 dark:text-neutral-100">
              {{ p.title }}
            </p>
            <p class="font-display text-sm font-bold text-brand">{{ formatPrice(p.price || 0) }}</p>
          </div>
          <Icon
            v-if="submittingId === p.id"
            name="eos-icons:loading"
            size="18"
            class="shrink-0 text-brand"
          />
          <Icon v-else name="solar:alt-arrow-right-linear" size="18" class="shrink-0 text-gray-300" />
        </button>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="emit('close')">Cancel</BaseButton>
      <BaseButton variant="ghost" @click="emit('quick-add')">
        <Icon name="solar:add-circle-linear" size="16" /> Quick add new
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import BaseInput from '~~/layers/ui/app/components/BaseInput.vue'
import BaseButton from '~~/layers/ui/app/components/BaseButton.vue'
import BaseSkeleton from '~~/layers/ui/app/components/BaseSkeleton.vue'
import BaseEmptyState from '~~/layers/ui/app/components/BaseEmptyState.vue'
import { useSellerManagement } from '~~/layers/seller/app/composables/useSellerManagement'
import { useProduct } from '~~/layers/commerce/app/composables/useProduct'
import { imgThumb } from '~~/layers/core/app/utils/cloudinary'
import { useCurrency } from '~~/layers/core/app/composables/useCurrency'

const emit = defineEmits<{ close: []; select: [product: any]; 'quick-add': [] }>()

const { sellers, loadUserSellers } = useSellerManagement()
const { fetchSellerProducts } = useProduct()
const { formatPrice } = useCurrency()

const products = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const submittingId = ref<number | null>(null)

const thumb = (p: any) => {
  const url = p.media?.[0]?.url
  return url ? imgThumb(url) : ''
}

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return products.value
  return products.value.filter((p) => p.title?.toLowerCase().includes(q))
})

onMounted(async () => {
  try {
    if (!sellers.value.length) await loadUserSellers()
    // Merge published products across all of the user's stores
    const lists = await Promise.all(
      sellers.value.map((s: { store_slug: string }) =>
        fetchSellerProducts(s.store_slug, { status: 'PUBLISHED', limit: 50 })
          .then((d) => d?.products ?? [])
          .catch(() => []),
      ),
    )
    const seen = new Set<number>()
    products.value = lists.flat().filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  } finally {
    loading.value = false
  }
})

const pick = (product: any) => {
  submittingId.value = product.id
  emit('select', product)
}
</script>
