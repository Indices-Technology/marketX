import { ref } from 'vue'
import { useDiscoverFilters } from './useDiscoverFilters'
import type { IProduct } from '../types/commerce.types'

export interface DiscoverTag {
  id: number
  name: string
  _count: { products: number; posts: number }
}

// Module-level singletons — one fetch, one state across all components
const allTags = ref<DiscoverTag[]>([])
const tagsLoading = ref(false)
const selectedTag = ref<DiscoverTag | null>(null)
const tagProducts = ref<IProduct[]>([])
const tagTotal = ref(0)
const tagProductsLoading = ref(false)

export function useDiscoverTags() {
  const { filters } = useDiscoverFilters()

  const loadTags = async (search?: string) => {
    tagsLoading.value = true
    try {
      const res = await $fetch<{ data: DiscoverTag[] }>('/api/tags', {
        params: {
          limit: 100,
          search: search || undefined,
          sort: filters.tags.sort,
        },
      })
      allTags.value = res?.data ?? []
    } catch {
      //
    } finally {
      tagsLoading.value = false
    }
  }

  const openTagView = async (tag: DiscoverTag) => {
    selectedTag.value = tag
    tagProducts.value = []
    tagTotal.value = 0
    tagProductsLoading.value = true
    try {
      const res = await $fetch<{ data: { products: IProduct[]; total: number } }>(`/api/tags/${tag.id}/products`)
      tagProducts.value = res?.data?.products ?? []
      tagTotal.value = res?.data?.total ?? 0
    } catch {
      //
    } finally {
      tagProductsLoading.value = false
    }
  }

  const clearSelectedTag = () => {
    selectedTag.value = null
    tagProducts.value = []
    tagTotal.value = 0
  }

  return {
    allTags,
    tagsLoading,
    selectedTag,
    tagProducts,
    tagTotal,
    tagProductsLoading,
    loadTags,
    openTagView,
    clearSelectedTag,
  }
}
