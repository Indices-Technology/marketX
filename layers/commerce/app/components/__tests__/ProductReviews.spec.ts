import { mount, flushPromises } from '@vue/test-utils'
import { vi } from 'vitest'
import ProductReviews from '../ProductReviews.vue'

vi.mock('~~/layers/profile/app/stores/profile.store', () => ({
  useProfileStore: vi.fn(() => ({ isLoggedIn: false, me: null })),
}))

vi.mock('@kyvg/vue3-notification', () => ({ notify: vi.fn() }))

vi.mock('~~/layers/core/app/utils/errors', () => ({
  extractErrorMessage: (_e: unknown, fallback: string) => fallback,
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
const emptyFetchResponse = () =>
  Promise.resolve({
    data: [],
    meta: { total: 0, averageRating: null, distribution: {}, hasMore: false },
  })

const makeReview = (overrides = {}) => ({
  id: 1,
  rating: 4,
  body: 'Great product!',
  title: null,
  verified: true,
  created_at: new Date().toISOString(),
  author: { username: 'alice' },
  ...overrides,
})

const global = {
  stubs: {
    Icon: { template: '<span />' },
    NuxtLink: { template: '<a><slot /></a>' },
    StarRating: { template: '<div class="star-rating" />', props: ['rating', 'size'] },
  },
}

describe('ProductReviews', () => {
  beforeEach(() => {
    vi.stubGlobal('$fetch', vi.fn().mockImplementation(emptyFetchResponse))
  })

  it('shows "No reviews yet" when no reviews are loaded', async () => {
    const wrapper = mount(ProductReviews, { props: { productId: 1 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('No reviews yet')
  })

  it('renders the review list when reviews are returned', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('eligibility')) return Promise.resolve({ data: { canReview: false } })
      return Promise.resolve({
        data: [makeReview()],
        meta: { total: 1, averageRating: 4.0, distribution: { 4: 1 }, hasMore: false },
      })
    }))
    const wrapper = mount(ProductReviews, { props: { productId: 1 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('alice')
    expect(wrapper.text()).toContain('Great product!')
  })

  it('shows "Verified buyer" badge on verified reviews', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('eligibility')) return Promise.resolve({ data: { canReview: false } })
      return Promise.resolve({
        data: [makeReview({ verified: true })],
        meta: { total: 1, averageRating: 4, distribution: { 4: 1 }, hasMore: false },
      })
    }))
    const wrapper = mount(ProductReviews, { props: { productId: 1 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('Verified buyer')
  })

  it('does not show "Verified buyer" badge on unverified reviews', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('eligibility')) return Promise.resolve({ data: { canReview: false } })
      return Promise.resolve({
        data: [makeReview({ verified: false })],
        meta: { total: 1, averageRating: 4, distribution: { 4: 1 }, hasMore: false },
      })
    }))
    const wrapper = mount(ProductReviews, { props: { productId: 1 }, global })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Verified buyer')
  })

  it('shows the summary card when reviews are present', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('eligibility')) return Promise.resolve({ data: { canReview: false } })
      return Promise.resolve({
        data: [makeReview()],
        meta: { total: 3, averageRating: 4.3, distribution: { 4: 2, 5: 1 }, hasMore: false },
      })
    }))
    const wrapper = mount(ProductReviews, { props: { productId: 1 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('4.3')
    expect(wrapper.text()).toContain('3 reviews')
  })

  it('shows "Sign in to leave a review" when not logged in', async () => {
    const wrapper = mount(ProductReviews, { props: { productId: 1 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('Sign in')
    expect(wrapper.text()).toContain('to leave a review')
  })

  it('shows "Verified buyers only" when logged in but cannot review', async () => {
    const { useProfileStore } = await import('~~/layers/profile/app/stores/profile.store')
    vi.mocked(useProfileStore).mockReturnValue({ isLoggedIn: true, me: { username: 'bob' } } as any)
    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('eligibility')) return Promise.resolve({ data: { canReview: false } })
      return emptyFetchResponse()
    }))
    const wrapper = mount(ProductReviews, { props: { productId: 1 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('Verified buyers only')
  })

  it('shows the review form when logged in and eligible to review', async () => {
    const { useProfileStore } = await import('~~/layers/profile/app/stores/profile.store')
    vi.mocked(useProfileStore).mockReturnValue({ isLoggedIn: true, me: { username: 'carol' } } as any)
    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('eligibility')) return Promise.resolve({ data: { canReview: true } })
      return emptyFetchResponse()
    }))
    const wrapper = mount(ProductReviews, { props: { productId: 1 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('Rate your purchase')
    expect(wrapper.find('textarea').exists()).toBe(true)
  })

  it('post button is disabled when no rating is selected', async () => {
    const { useProfileStore } = await import('~~/layers/profile/app/stores/profile.store')
    vi.mocked(useProfileStore).mockReturnValue({ isLoggedIn: true, me: { username: 'carol' } } as any)
    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('eligibility')) return Promise.resolve({ data: { canReview: true } })
      return emptyFetchResponse()
    }))
    const wrapper = mount(ProductReviews, { props: { productId: 1 }, global })
    await flushPromises()
    const postBtn = wrapper.find('button.rounded-xl.bg-brand')
    expect(postBtn.attributes('disabled')).toBeDefined()
  })

  it('shows already-reviewed message when user has a review', async () => {
    const { useProfileStore } = await import('~~/layers/profile/app/stores/profile.store')
    vi.mocked(useProfileStore).mockReturnValue({ isLoggedIn: true, me: { username: 'alice' } } as any)
    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('eligibility'))
        return Promise.resolve({ data: { canReview: true, existingReview: makeReview() } })
      return Promise.resolve({
        data: [makeReview()],
        meta: { total: 1, averageRating: 4, distribution: { 4: 1 }, hasMore: false },
      })
    }))
    const wrapper = mount(ProductReviews, { props: { productId: 1 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('You reviewed this product')
  })

  it('shows "Load more reviews" button when hasMore is true', async () => {
    vi.stubGlobal('$fetch', vi.fn().mockImplementation((url: string) => {
      if (url.includes('eligibility')) return Promise.resolve({ data: { canReview: false } })
      return Promise.resolve({
        data: Array.from({ length: 10 }, (_, i) => makeReview({ id: i + 1 })),
        meta: { total: 25, averageRating: 4, distribution: { 4: 10 }, hasMore: true },
      })
    }))
    const wrapper = mount(ProductReviews, { props: { productId: 1 }, global })
    await flushPromises()
    expect(wrapper.text()).toContain('Load more reviews')
  })

  it('calls $fetch with correct productId', async () => {
    const fetchMock = vi.fn().mockImplementation(emptyFetchResponse)
    vi.stubGlobal('$fetch', fetchMock)
    mount(ProductReviews, { props: { productId: 42 }, global })
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/products/42/reviews'),
      expect.anything(),
    )
  })
})
