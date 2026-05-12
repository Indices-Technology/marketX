import { mount } from '@vue/test-utils'
import { vi } from 'vitest'
import ShopProductCard from '../ShopProductCard.vue'

// ── Module mocks (all composables are explicitly imported in this component) ──
// Paths are relative to this test file (layers/commerce/app/components/__tests__/)
// The component imports ../composables/... but from here that's ../../composables/...
vi.mock('../../composables/useCart', () => ({
  useCart: () => ({ addToCart: vi.fn() }),
}))

vi.mock('../../composables/useProduct', () => ({
  useProduct: () => ({ likeProduct: vi.fn(), unlikeProduct: vi.fn() }),
}))

vi.mock('~~/layers/core/app/composables/useCurrency', () => ({
  useCurrency: () => ({ formatPrice: (v: number) => `₦${v}` }),
}))

vi.mock('~~/layers/profile/app/stores/profile.store', () => ({
  useProfileStore: () => ({ isLoggedIn: false }),
}))

vi.mock('@kyvg/vue3-notification', () => ({ notify: vi.fn() }))

vi.mock('~~/layers/core/app/utils/cloudinary', () => ({
  imgThumb: (url: string) => url,
  videoFeedUrl: (url: string) => url,
  videoThumb: (url: string) => url,
  imgLqip: (url: string) => url,
}))

vi.mock('~~/layers/feed/app/composables/useFeedSound', async () => {
  const { ref } = await vi.importActual<typeof import('vue')>('vue')
  return { useFeedSound: () => ({ soundEnabled: ref(false) }) }
})

vi.mock('~~/layers/social/app/composables/useShareModal', () => ({
  useShareModal: () => ({ openShare: vi.fn() }),
}))

// ── Shared fixture ────────────────────────────────────────────────────────────
const makeProduct = (overrides = {}) => ({
  id: 2,
  title: 'Hand-woven Aso-Oke',
  slug: 'aso-oke',
  price: 25000,
  discount: 0,
  isThrift: false,
  viewCount: 120,
  media: [],
  variants: [{ id: 20, stock: 8 }],
  _count: { likes: 10, comments: 4 },
  seller: { store_name: 'Balogun Fabrics', store_slug: 'balogun-fabrics' },
  affiliateCommission: 0,
  ...overrides,
})

const global = {
  stubs: {
    Icon: { template: '<span />' },
    NuxtLink: { template: '<a><slot /></a>' },
    ModalsLikesModal: true,
  },
}

describe('ShopProductCard', () => {
  it('renders the product title', () => {
    const wrapper = mount(ShopProductCard, { props: { product: makeProduct() }, global })
    expect(wrapper.text()).toContain('Hand-woven Aso-Oke')
  })

  it('renders the formatted price', () => {
    const wrapper = mount(ShopProductCard, { props: { product: makeProduct() }, global })
    expect(wrapper.text()).toContain('₦25000')
  })

  it('renders original and discounted price when discount > 0', () => {
    const product = makeProduct({ price: 30000, discount: 10 })
    const wrapper = mount(ShopProductCard, { props: { product }, global })
    expect(wrapper.text()).toContain('₦27000') // discounted
    expect(wrapper.text()).toContain('₦30000') // original
  })

  it('shows "Thrift" badge when isThrift is true', () => {
    const wrapper = mount(ShopProductCard, { props: { product: makeProduct({ isThrift: true }) }, global })
    expect(wrapper.text()).toContain('Thrift')
  })

  it('shows discount badge when discount > 0', () => {
    const wrapper = mount(ShopProductCard, { props: { product: makeProduct({ discount: 15 }) }, global })
    expect(wrapper.text()).toContain('−15%')
  })

  it('shows "Sold out" when lowest stock is 0', () => {
    const product = makeProduct({ variants: [{ id: 20, stock: 0 }] })
    const wrapper = mount(ShopProductCard, { props: { product }, global })
    expect(wrapper.text()).toContain('Sold out')
  })

  it('shows "Only N left" when lowest stock is ≤ 5', () => {
    const product = makeProduct({ variants: [{ id: 20, stock: 2 }] })
    const wrapper = mount(ShopProductCard, { props: { product }, global })
    expect(wrapper.text()).toContain('Only 2 left')
  })

  it('renders the like count from _count.likes', () => {
    const wrapper = mount(ShopProductCard, { props: { product: makeProduct() }, global })
    expect(wrapper.text()).toContain('10')
  })

  it('renders the comment count from _count.comments', () => {
    const wrapper = mount(ShopProductCard, { props: { product: makeProduct() }, global })
    expect(wrapper.text()).toContain('4')
  })

  it('renders view count when viewCount is present', () => {
    const wrapper = mount(ShopProductCard, { props: { product: makeProduct({ viewCount: 999 }) }, global })
    expect(wrapper.text()).toContain('999')
  })

  it('emits open-detail with the product when the card is clicked', async () => {
    const product = makeProduct()
    const wrapper = mount(ShopProductCard, { props: { product }, global })
    await wrapper.find('.group').trigger('click')
    expect(wrapper.emitted('open-detail')![0]![0]).toMatchObject({ id: 2 })
  })

  it('emits open-comments when the comment button is clicked', async () => {
    const product = makeProduct()
    const wrapper = mount(ShopProductCard, { props: { product }, global })
    const commentBtn = wrapper.findAll('button').find((b) => b.text().includes('4'))
    await commentBtn!.trigger('click')
    expect(wrapper.emitted('open-comments')).toBeTruthy()
  })

  it('disables the cart button when out of stock', () => {
    const product = makeProduct({ variants: [{ id: 20, stock: 0 }] })
    const wrapper = mount(ShopProductCard, { props: { product }, global })
    // The cart button is disabled — find it by its disabled state
    const cartBtn = wrapper.findAll('button').find((b) => b.attributes('disabled') !== undefined)
    expect(cartBtn).toBeTruthy()
  })

  it('shows the market button when affiliateCommission > 0', () => {
    const product = makeProduct({ affiliateCommission: 10 })
    const wrapper = mount(ShopProductCard, { props: { product }, global })
    const marketBtn = wrapper.find('button[title="Market this product and earn commission"]')
    expect(marketBtn.exists()).toBe(true)
  })

  it('does not show market button when affiliateCommission is 0', () => {
    const wrapper = mount(ShopProductCard, { props: { product: makeProduct({ affiliateCommission: 0 }) }, global })
    expect(wrapper.find('button[title="Market this product and earn commission"]').exists()).toBe(false)
  })

  it('renders a single image when media has one IMAGE entry', () => {
    const product = makeProduct({
      media: [{ id: 1, type: 'IMAGE', url: 'https://cdn.example.com/photo.jpg', isBgMusic: false }],
    })
    const wrapper = mount(ShopProductCard, { props: { product }, global })
    expect(wrapper.find('img[alt="Hand-woven Aso-Oke"]').exists()).toBe(true)
  })
})
