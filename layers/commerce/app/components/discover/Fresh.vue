<template>
  <div class="mt-5">
    <CategoryPills
      v-if="props.categories.length"
      :categories="props.categories"
      :model-value="props.selectedCategory"
      class="mb-4"
      @update:model-value="emit('update:selectedCategory', $event)"
    />

    <ProductMasonryGrid
      :products="freshProducts"
      :loading="freshLoading"
      :has-more="freshHasMore"
      show-age
      @open-detail="emit('open-detail', $event)"
      @load-more="loadData()"
    >
      <template #empty>
        <div class="py-24 text-center">
          <Icon
            name="mdi:lightning-bolt-outline"
            size="48"
            class="mx-auto mb-3 text-gray-300 dark:text-neutral-600"
          />
          <p class="text-sm text-gray-500 dark:text-neutral-400">
            No fresh drops yet{{ props.searchInput ? ` for "${props.searchInput}"` : '' }}
          </p>
        </div>
      </template>
    </ProductMasonryGrid>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type { IProduct } from '~~/layers/commerce/app/types/commerce.types'
import type { Category } from '~~/shared/types/category'
import CategoryPills from '~~/layers/commerce/app/components/CategoryPills.vue'
import ProductMasonryGrid from '~~/layers/commerce/app/components/ProductMasonryGrid.vue'
import { useProduct } from '~~/layers/commerce/app/composables/useProduct'
import { useDiscoverFilters } from '~~/layers/commerce/app/composables/useDiscoverFilters'

const props = defineProps<{
  searchInput: string
  selectedCategory: string | null
  categories: Category[]
}>()

const emit = defineEmits<{
  'open-detail': [product: IProduct]
  'update:selectedCategory': [value: string | null]
}>()

const { filters: discoverFilters } = useDiscoverFilters()
const { fetchProducts } = useProduct()

const PROD_LIMIT = 24
const freshProducts = ref<IProduct[]>([])
const freshTotal = ref(0)
const freshLoading = ref(false)
let freshGen = 0

const freshHasMore = computed(() => freshProducts.value.length < freshTotal.value)

const loadData = async (reset = false) => {
  if (reset) {
    freshProducts.value = []
    freshTotal.value = 0
    freshGen++
    freshLoading.value = false
  }
  if (freshLoading.value) return
  freshLoading.value = true
  const gen = freshGen
  try {
    const params: any = { status: 'PUBLISHED' }
    if (props.searchInput.trim()) params.search = props.searchInput.trim()
    if (props.selectedCategory) params.categorySlug = props.selectedCategory
    if (discoverFilters.fresh.sortBy !== 'newest')
      params.sortBy = discoverFilters.fresh.sortBy
    if (discoverFilters.fresh.minPrice != null)
      params.minPrice = discoverFilters.fresh.minPrice
    if (discoverFilters.fresh.maxPrice != null)
      params.maxPrice = discoverFilters.fresh.maxPrice
    const result = await fetchProducts({
      ...params,
      limit: PROD_LIMIT,
      offset: freshProducts.value.length,
    })
    if (gen !== freshGen) return
    freshProducts.value.push(...(result?.products ?? []))
    freshTotal.value = result?.total ?? 0
  } catch {
    //
  } finally {
    if (gen === freshGen) freshLoading.value = false
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch(
  () => props.searchInput,
  () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => loadData(true), 350)
  },
)

watch(() => props.selectedCategory, () => loadData(true))

watch(
  () => ({ ...discoverFilters.fresh }),
  () => loadData(true),
  { deep: true },
)

onMounted(() => loadData())

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer)
})
</script>
