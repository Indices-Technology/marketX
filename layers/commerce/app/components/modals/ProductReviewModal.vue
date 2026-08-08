<!-- ProductReviewModal — the "comments" affordance on a product (or product
     reel) opens REVIEWS, not free-form comments.

     A product's discussion surface is its review record: on a trust/escrow
     marketplace an unverified comment thread on a listing is noise at best
     and a manipulation vector at worst, whereas a review is only writable by
     someone who actually received the goods. That gate is not re-implemented
     here — `ProductReviews` already calls
     GET /api/products/:id/reviews/eligibility, which returns `canReview`
     only when the user has a DELIVERED order containing this product (and
     surfaces their existing review, since it's one per buyer per product).
     This component is purely the modal shell around that same section the
     product page renders, so the rules can never drift between surfaces. -->
<template>
  <BaseModal
    :model-value="isOpen"
    title="Reviews"
    max-width="lg"
    height="screen"
    @update:model-value="(v) => !v && $emit('close')"
  >
    <ProductReviews v-if="productId" :product-id="productId" />
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseModal from '~~/layers/ui/app/components/BaseModal.vue'
import ProductReviews from '~~/layers/commerce/app/components/ProductReviews.vue'

const props = defineProps<{
  isOpen: boolean
  /** Accepts either a product object or a bare id — feed surfaces hold the
      whole product, detail surfaces often only have the id. */
  product?: { id?: number | string } | null
  productId?: number | string | null
}>()
defineEmits<{ close: [] }>()

const productId = computed(() => {
  const raw = props.productId ?? props.product?.id
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : null
})
</script>
