import { ref } from 'vue'
import type { IFeedItem } from '~~/layers/feed/app/types/feed.types'
import type { IProduct } from '~~/layers/social/app/types/post.types'

/**
 * One "comment" affordance, two destinations by content type: a post gets its
 * comment thread (PostDetailModal), a product — including a product reel —
 * gets its review record (ProductReviewModal), which only a confirmed buyer
 * can write to.
 *
 * Routing on `item.type` rather than on which component emitted, so FeedSlide
 * and ReelItem behave identically. Shared rather than reimplemented per page
 * because the two reel surfaces (MinimalHome and /reels) had already drifted:
 * /reels was opening a ProductDetailModal — the product's *sales* page — off
 * the comment button, which is neither a comment thread nor a review.
 *
 * Not a singleton: each surface owns its own open/closed state, so returning
 * fresh refs per call is deliberate.
 */
export const useFeedComments = () => {
  const selectedPost = ref<IFeedItem | null>(null)
  const reviewProduct = ref<Partial<IProduct> | null>(null)

  const openComments = (item: IFeedItem) => {
    if (item.type === 'PRODUCT' && item.product) {
      reviewProduct.value = item.product
      return
    }
    selectedPost.value = item
  }

  const closeComments = () => {
    selectedPost.value = null
    reviewProduct.value = null
  }

  return { selectedPost, reviewProduct, openComments, closeComments }
}
