import { ref } from 'vue'

export type FeedTab = 'for-you' | 'following' | 'trending' | 'deals'

export interface IFeedTabDef {
  id: FeedTab
  label: string
  icon: string
  endpoint: string
}

export const FEED_TABS: IFeedTabDef[] = [
  { id: 'for-you',   label: 'For You',   icon: 'solar:home-linear',  endpoint: '/api/feed/home' },
  { id: 'following', label: 'Following', icon: 'solar:user-heart-linear',  endpoint: '/api/feed/following' },
  { id: 'trending',  label: 'Trending',  icon: 'solar:graph-up-linear',            endpoint: '/api/feed/discover' },
  { id: 'deals',     label: 'Deals',     icon: 'solar:tag-linear',      endpoint: '/api/feed/deals' },
]

// Module-level singleton so HomeLayout and index.vue share the same ref
const activeTab = ref<FeedTab>('for-you')

export function useFeedTab() {
  const setTab = (tab: FeedTab) => { activeTab.value = tab }
  return { activeTab, setTab, FEED_TABS }
}
